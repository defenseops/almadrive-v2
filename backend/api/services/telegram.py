from __future__ import annotations

import os
import logging
from typing import Dict, List

import httpx
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# {chat_id: {"action": "await_price", "booking_id": int, "executor": str}}
_pending: Dict[int, Dict] = {}

STATUS_LABELS = {
    "new": "🆕 Новый",
    "confirmed": "✅ Подтверждён",
    "in_progress": "🚗 В процессе",
    "done": "✔️ Выполнен",
    "cancelled": "❌ Отменён",
}


def _token() -> str:
    return (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()


def _admins() -> List[int]:
    result: List[int] = []
    for x in (os.getenv("TELEGRAM_ADMINS") or "").split(","):
        x = x.strip()
        if x.isdigit():
            result.append(int(x))
    return result


def _is_admin(chat_id: int) -> bool:
    return chat_id in _admins()


async def _api(method: str, payload: dict) -> dict:
    token = _token()
    if not token:
        return {}
    url = f"https://api.telegram.org/bot{token}/{method}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            return resp.json()
    except Exception as exc:
        logger.warning("Telegram API %s failed: %s", method, exc)
        return {}


async def _send(chat_id: int, text: str, keyboard: dict | None = None) -> dict:
    payload: dict = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if keyboard:
        payload["reply_markup"] = keyboard
    return await _api("sendMessage", payload)


async def _edit(chat_id: int, message_id: int, text: str, keyboard: dict | None = None) -> dict:
    payload: dict = {"chat_id": chat_id, "message_id": message_id, "text": text, "parse_mode": "HTML"}
    if keyboard:
        payload["reply_markup"] = keyboard
    return await _api("editMessageText", payload)


def _fmt(n: int) -> str:
    return f"{n:,} ₸".replace(",", " ")


def _booking_text(b) -> str:
    date_str = b.service_date.strftime("%d.%m.%Y %H:%M") if hasattr(b.service_date, "strftime") else str(b.service_date)[:16]
    price = _fmt(b.actual_price) if b.actual_price else (f"~{_fmt(b.estimated_price)}" if b.estimated_price else "—")
    executor = {"owner": "Мы", "hired": "Наёмник"}.get(b.executor or "", "не назначен")
    earnings = _fmt(b.owner_earnings) if b.owner_earnings else "—"
    status = STATUS_LABELS.get(b.status, b.status)

    return (
        f"<b>Заявка #{b.id}</b>\n\n"
        f"📞 {b.contact}\n"
        f"📅 {date_str}\n"
        f"💬 {b.comment or '—'}\n\n"
        f"Статус: {status}\n"
        f"Исполнитель: {executor}\n"
        f"Сумма клиента: {price}\n"
        f"Наш заработок: {earnings}"
    )


def _order_keyboard(b) -> dict:
    rows = []

    if b.status not in ("done", "cancelled"):
        # Status buttons
        status_row = []
        if b.status == "new":
            status_row.append({"text": "✅ Подтвердить", "callback_data": f"st:confirmed:{b.id}"})
        if b.status in ("new", "confirmed"):
            status_row.append({"text": "🚗 В процессе", "callback_data": f"st:in_progress:{b.id}"})
        status_row.append({"text": "❌ Отменить", "callback_data": f"st:cancelled:{b.id}"})
        rows.append(status_row)

        # Assignment buttons
        if not b.executor:
            rows.append([
                {"text": "👤 Мы берём", "callback_data": f"assign:owner:{b.id}"},
                {"text": "🚗 Наёмник", "callback_data": f"assign:hired:{b.id}"},
            ])
        else:
            rows.append([{"text": "✏️ Изменить исполнителя / сумму", "callback_data": f"reassign:{b.id}"}])

    rows.append([{"text": "« К списку", "callback_data": "orders:0"}])
    return {"inline_keyboard": rows}


def _orders_keyboard(bookings: list, page: int, status_filter: str) -> dict:
    rows = []
    page_size = 6
    start = page * page_size
    chunk = bookings[start:start + page_size]

    for b in chunk:
        label = f"#{b.id} {b.contact[:20]} — {STATUS_LABELS.get(b.status, b.status)}"
        rows.append([{"text": label, "callback_data": f"order:{b.id}"}])

    # Pagination
    nav = []
    if page > 0:
        nav.append({"text": "◀️", "callback_data": f"orders:{page - 1}:{status_filter}"})
    if start + page_size < len(bookings):
        nav.append({"text": "▶️", "callback_data": f"orders:{page + 1}:{status_filter}"})
    if nav:
        rows.append(nav)

    # Filter tabs
    rows.append([
        {"text": "Все" if status_filter == "" else "• Все", "callback_data": "orders:0:"},
        {"text": "Новые" if status_filter != "new" else "• Новые", "callback_data": "orders:0:new"},
        {"text": "Активные" if status_filter != "active" else "• Активные", "callback_data": "orders:0:active"},
    ])

    return {"inline_keyboard": rows}


# ── Public API ────────────────────────────────────────────────────────────────

async def send_booking_notification(
    *,
    booking_id: int,
    service_name: str,
    vehicle_class_name: str,
    service_date: str,
    contact: str,
    comment: str | None,
    estimated_price: int | None,
) -> None:
    token = _token()
    admins = _admins()
    if not token or not admins:
        logger.info("Telegram notification skipped")
        return

    price_text = _fmt(estimated_price) if estimated_price else "не рассчитана"
    text = (
        f"<b>📩 Новая заявка #{booking_id}</b>\n\n"
        f"🛎 {service_name}\n"
        f"🚘 {vehicle_class_name}\n"
        f"📅 {service_date}\n"
        f"💰 Примерная: {price_text}\n"
        f"📞 {contact}\n"
        f"💬 {comment or '—'}"
    )

    keyboard = {
        "inline_keyboard": [[
            {"text": "👤 Мы берём", "callback_data": f"assign:owner:{booking_id}"},
            {"text": "🚗 Наёмник", "callback_data": f"assign:hired:{booking_id}"},
        ], [
            {"text": "📋 Открыть заявку", "callback_data": f"order:{booking_id}"},
        ]]
    }

    async with httpx.AsyncClient(timeout=10) as client:
        for admin_id in admins:
            try:
                await client.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": admin_id, "text": text, "parse_mode": "HTML", "reply_markup": keyboard},
                )
            except Exception as exc:
                logger.warning("Telegram send failed for %s: %s", admin_id, exc)


async def handle_update(update: dict, db: Session) -> None:
    if "callback_query" in update:
        await _handle_callback(update["callback_query"], db)
    elif "message" in update:
        await _handle_message(update["message"], db)


# ── Handlers ──────────────────────────────────────────────────────────────────

async def _handle_message(msg: dict, db: Session) -> None:
    chat_id = msg.get("from", {}).get("id") or msg.get("chat", {}).get("id")
    text = (msg.get("text") or "").strip()
    if not chat_id:
        return

    if not _is_admin(chat_id):
        await _send(chat_id, "⛔️ Нет доступа.")
        return

    # Waiting for price input
    if chat_id in _pending and _pending[chat_id].get("action") == "await_price":
        await _handle_price_input(chat_id, text, db)
        return

    # Commands
    if text in ("/start", "/menu"):
        await _send_menu(chat_id)
    elif text == "/orders":
        await _show_orders(chat_id, 0, "", db)
    elif text == "/stats":
        await _show_stats(chat_id, db)
    elif text == "/reviews":
        await _show_reviews(chat_id, db)
    elif text.startswith("/order_"):
        try:
            bid = int(text.split("_")[1])
            await _show_order(chat_id, bid, db)
        except (IndexError, ValueError):
            await _send(chat_id, "Неверный формат. Пример: /order_42")
    else:
        await _send_menu(chat_id)


async def _handle_callback(cq: dict, db: Session) -> None:
    cq_id = cq.get("id", "")
    chat_id = (cq.get("from") or {}).get("id")
    msg_id = (cq.get("message") or {}).get("id")
    data = cq.get("data", "")

    if not chat_id:
        return

    await _api("answerCallbackQuery", {"callback_query_id": cq_id})

    if not _is_admin(chat_id):
        return

    if data.startswith("order:"):
        booking_id = int(data.split(":")[1])
        await _show_order(chat_id, booking_id, db, edit_msg_id=msg_id)

    elif data.startswith("orders:"):
        parts = data.split(":")
        page = int(parts[1]) if len(parts) > 1 and parts[1].lstrip("-").isdigit() else 0
        status_filter = parts[2] if len(parts) > 2 else ""
        await _show_orders(chat_id, page, status_filter, db, edit_msg_id=msg_id)

    elif data.startswith("st:"):
        _, new_status, bid_str = data.split(":")
        await _change_status(chat_id, msg_id, int(bid_str), new_status, db)

    elif data.startswith("assign:"):
        _, executor, bid_str = data.split(":")
        booking_id = int(bid_str)
        _pending[chat_id] = {"action": "await_price", "booking_id": booking_id, "executor": executor}
        label = "Мы берём" if executor == "owner" else "Наёмник"
        await _api("answerCallbackQuery", {"callback_query_id": cq_id, "text": f"Выбрано: {label}"})
        await _send(chat_id, f"Заявка #{booking_id} → <b>{label}</b>\n\nВведите итоговую сумму (в тенге):")

    elif data == "stats":
        await _show_stats(chat_id, db)

    elif data in ("reviews", "menu_reviews"):
        await _show_reviews(chat_id, db, edit_msg_id=msg_id)

    elif data == "menu":
        await _send_menu(chat_id)

    elif data.startswith("rv:"):
        parts = data.split(":")
        action, review_id = parts[1], int(parts[2])
        await _handle_review_action(chat_id, msg_id, review_id, action, db)

    elif data.startswith("reassign:"):
        booking_id = int(data.split(":")[1])
        await _edit(chat_id, msg_id, f"Заявка #{booking_id} — смена исполнителя:", {
            "inline_keyboard": [[
                {"text": "👤 Мы берём", "callback_data": f"assign:owner:{booking_id}"},
                {"text": "🚗 Наёмник", "callback_data": f"assign:hired:{booking_id}"},
            ], [
                {"text": "« Назад", "callback_data": f"order:{booking_id}"},
            ]]
        })


async def _handle_price_input(chat_id: int, text: str, db: Session) -> None:
    clean = text.replace(" ", "").replace(",", "")
    if not clean.isdigit():
        await _send(chat_id, "Введите число (сумму в тенге):")
        return

    actual_price = int(clean)
    state = _pending.pop(chat_id)
    booking_id = state["booking_id"]
    executor = state["executor"]

    try:
        from api.models import BookingRequest
    except ImportError:
        from models import BookingRequest  # type: ignore

    booking = db.query(BookingRequest).filter(BookingRequest.id == booking_id).first()
    if not booking:
        await _send(chat_id, f"Заявка #{booking_id} не найдена.")
        return

    booking.executor = executor
    booking.actual_price = actual_price
    booking.owner_earnings = actual_price if executor == "owner" else actual_price * 20 // 100
    booking.status = "done"
    db.commit()
    db.refresh(booking)

    executor_label = "Мы берём" if executor == "owner" else "Наёмник"
    await _send(
        chat_id,
        f"✅ <b>Заявка #{booking_id} завершена</b>\n\n"
        f"Исполнитель: {executor_label}\n"
        f"Сумма клиента: {_fmt(actual_price)}\n"
        f"Наш заработок: {_fmt(booking.owner_earnings)}",
        {"inline_keyboard": [[{"text": "📋 Открыть заявку", "callback_data": f"order:{booking_id}"}]]}
    )


async def _change_status(chat_id: int, msg_id: int, booking_id: int, new_status: str, db: Session) -> None:
    try:
        from api.models import BookingRequest
    except ImportError:
        from models import BookingRequest  # type: ignore

    booking = db.query(BookingRequest).filter(BookingRequest.id == booking_id).first()
    if not booking:
        await _send(chat_id, f"Заявка #{booking_id} не найдена.")
        return

    if new_status == "done" and not booking.executor:
        await _send(chat_id, "⚠️ Сначала назначьте исполнителя и укажите сумму.")
        return

    booking.status = new_status
    db.commit()
    db.refresh(booking)

    await _edit(chat_id, msg_id, _booking_text(booking), _order_keyboard(booking))


async def _show_order(chat_id: int, booking_id: int, db: Session, edit_msg_id: int | None = None) -> None:
    try:
        from api.models import BookingRequest
    except ImportError:
        from models import BookingRequest  # type: ignore

    booking = db.query(BookingRequest).filter(BookingRequest.id == booking_id).first()
    if not booking:
        await _send(chat_id, f"Заявка #{booking_id} не найдена.")
        return

    text = _booking_text(booking)
    kb = _order_keyboard(booking)

    if edit_msg_id:
        await _edit(chat_id, edit_msg_id, text, kb)
    else:
        await _send(chat_id, text, kb)


async def _show_orders(chat_id: int, page: int, status_filter: str, db: Session, edit_msg_id: int | None = None) -> None:
    try:
        from api.models import BookingRequest
    except ImportError:
        from models import BookingRequest  # type: ignore

    q = db.query(BookingRequest)
    if status_filter == "new":
        q = q.filter(BookingRequest.status == "new")
    elif status_filter == "active":
        q = q.filter(BookingRequest.status.in_(["confirmed", "in_progress"]))
    bookings = q.order_by(BookingRequest.id.desc()).limit(100).all()

    if not bookings:
        text = "Нет заказов."
        kb = {"inline_keyboard": [[{"text": "🔄 Обновить", "callback_data": f"orders:0:{status_filter}"}]]}
    else:
        total = len(bookings)
        text = f"<b>Заказы</b> ({total})\nВыберите заявку:"
        kb = _orders_keyboard(bookings, page, status_filter)

    if edit_msg_id:
        await _edit(chat_id, edit_msg_id, text, kb)
    else:
        await _send(chat_id, text, kb)


async def _show_stats(chat_id: int, db: Session) -> None:
    try:
        from api.models import BookingRequest
    except ImportError:
        from models import BookingRequest  # type: ignore

    all_bookings = db.query(BookingRequest).all()
    done = [b for b in all_bookings if b.status == "done"]
    owner_orders = [b for b in done if b.executor == "owner"]
    hired_orders = [b for b in done if b.executor == "hired"]
    total_earnings = sum(b.owner_earnings or 0 for b in done)
    pending = [b for b in all_bookings if b.status in ("new", "confirmed", "in_progress")]

    text = (
        f"<b>📊 Статистика AlmaDrive</b>\n\n"
        f"Всего заявок: {len(all_bookings)}\n"
        f"Активных: {len(pending)}\n"
        f"Выполнено: {len(done)}\n\n"
        f"👤 Наши заказы: {len(owner_orders)}\n"
        f"🚗 Наёмники: {len(hired_orders)}\n\n"
        f"💰 Наш заработок: {_fmt(total_earnings)}"
    )

    await _send(chat_id, text, {"inline_keyboard": [[
        {"text": "📋 Заказы", "callback_data": "orders:0:"},
        {"text": "🆕 Новые", "callback_data": "orders:0:new"},
    ]]})


async def _show_reviews(chat_id: int, db: Session, edit_msg_id: int | None = None) -> None:
    try:
        from api.models import ServiceReview
    except ImportError:
        from models import ServiceReview  # type: ignore

    reviews = (
        db.query(ServiceReview)
        .order_by(ServiceReview.id.desc())
        .limit(30)
        .all()
    )

    pending = [r for r in reviews if not r.is_approved]

    if not reviews:
        text = "Нет отзывов."
        kb = {"inline_keyboard": [[{"text": "🔄 Обновить", "callback_data": "reviews"}]]}
    else:
        text = f"<b>💬 Отзывы</b>\nНа модерации: {len(pending)}\n\nВыберите отзыв:"
        rows = []
        for r in reviews:
            status = "⏳" if not r.is_approved else "✅"
            author = r.author_name or "Аноним"
            preview = r.text[:30] + "…" if len(r.text) > 30 else r.text
            rows.append([{"text": f"{status} {author}: {preview}", "callback_data": f"rv:view:{r.id}"}])
        rows.append([{"text": "« Меню", "callback_data": "menu"}])
        kb = {"inline_keyboard": rows}

    if edit_msg_id:
        await _edit(chat_id, edit_msg_id, text, kb)
    else:
        await _send(chat_id, text, kb)


async def _handle_review_action(chat_id: int, msg_id: int | None, review_id: int, action: str, db: Session) -> None:
    try:
        from api.models import ServiceReview
    except ImportError:
        from models import ServiceReview  # type: ignore

    review = db.query(ServiceReview).filter(ServiceReview.id == review_id).first()
    if not review:
        await _send(chat_id, "Отзыв не найден.")
        return

    if action == "view":
        stars = "⭐" * review.rating + "☆" * (5 - review.rating)
        status = "⏳ На модерации" if not review.is_approved else "✅ Опубликован"
        author = review.author_name or "Аноним"
        date = review.created_at.strftime("%d.%m.%Y") if hasattr(review.created_at, "strftime") else ""
        text = (
            f"<b>Отзыв #{review.id}</b>\n\n"
            f"👤 {author} · {date}\n"
            f"{stars}\n\n"
            f"{review.text}\n\n"
            f"Статус: {status}"
        )
        rows = []
        if not review.is_approved:
            rows.append([{"text": "✅ Опубликовать", "callback_data": f"rv:approve:{review_id}"}])
        else:
            rows.append([{"text": "🙈 Скрыть", "callback_data": f"rv:hide:{review_id}"}])
        rows.append([
            {"text": "🗑 Удалить", "callback_data": f"rv:delete:{review_id}"},
            {"text": "« К списку", "callback_data": "reviews"},
        ])
        kb = {"inline_keyboard": rows}
        if msg_id:
            await _edit(chat_id, msg_id, text, kb)
        else:
            await _send(chat_id, text, kb)

    elif action == "approve":
        review.is_approved = True
        db.commit()
        await _send(chat_id, f"✅ Отзыв #{review_id} опубликован.",
                    {"inline_keyboard": [[{"text": "« К отзывам", "callback_data": "reviews"}]]})

    elif action == "hide":
        review.is_approved = False
        db.commit()
        await _send(chat_id, f"🙈 Отзыв #{review_id} скрыт.",
                    {"inline_keyboard": [[{"text": "« К отзывам", "callback_data": "reviews"}]]})

    elif action == "delete":
        db.delete(review)
        db.commit()
        await _send(chat_id, f"🗑 Отзыв #{review_id} удалён.",
                    {"inline_keyboard": [[{"text": "« К отзывам", "callback_data": "reviews"}]]})


async def _send_menu(chat_id: int) -> None:
    await _send(
        chat_id,
        "<b>AlmaDrive Admin Bot</b>\n\n"
        "📋 /orders — все заказы\n"
        "📊 /stats — статистика\n"
        "💬 /reviews — отзывы\n"
        "/order_N — открыть заявку #N",
        {"inline_keyboard": [
            [
                {"text": "📋 Заказы", "callback_data": "orders:0:"},
                {"text": "🆕 Новые", "callback_data": "orders:0:new"},
            ],
            [
                {"text": "📊 Статистика", "callback_data": "stats"},
                {"text": "💬 Отзывы", "callback_data": "reviews"},
            ],
        ]}
    )
