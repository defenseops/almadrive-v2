"""
Запуск бота в режиме polling (для локальной разработки).
На продакшене используется webhook.

Запуск: python bot_polling.py
"""
from __future__ import annotations

import asyncio
import os
import logging

import httpx
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

try:
    from api.services.telegram import handle_update
    from api.database import SessionLocal
except ImportError:
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from api.services.telegram import handle_update
    from api.database import SessionLocal


TOKEN = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
BASE = f"https://api.telegram.org/bot{TOKEN}"


async def poll() -> None:
    if not TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не задан")
        return

    offset = 0
    logger.info("Бот запущен в режиме polling...")

    async with httpx.AsyncClient(timeout=35) as client:
        while True:
            try:
                resp = await client.get(
                    f"{BASE}/getUpdates",
                    params={"offset": offset, "timeout": 30, "allowed_updates": ["message", "callback_query"]},
                )
                data = resp.json()
                if not data.get("ok"):
                    logger.warning("getUpdates error: %s", data)
                    await asyncio.sleep(3)
                    continue

                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    db = SessionLocal()
                    try:
                        await handle_update(update, db)
                    except Exception as e:
                        logger.error("Error handling update: %s", e)
                    finally:
                        db.close()

            except (httpx.ReadTimeout, httpx.ConnectError):
                pass
            except Exception as e:
                logger.error("Polling error: %s", e)
                await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(poll())
