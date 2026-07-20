"""
github_db.py — stub للتوافق مع المستودع الأصلي
يوفر دوالاً وهمية عند غياب رمز GitHub أو عدم الحاجة إلى المزامنة.
"""
import logging
logger = logging.getLogger(__name__)


def gh_save(repo_path: str, local_path: str, payload, commit_msg: str = "تحديث") -> bool:
    """حفظ وهمي — يسجّل فقط دون رفع إلى GitHub."""
    try:
        import os, json
        os.makedirs(os.path.dirname(local_path), exist_ok=True) if os.path.dirname(local_path) else None
        with open(local_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        logger.debug(f"gh_save (local only): {local_path}")
        return True
    except Exception as e:
        logger.warning(f"gh_save error: {e}")
        return False


def gh_load(repo_path: str, local_path: str):
    """تحميل وهمي — يقرأ من الملف المحلي إن وُجد."""
    try:
        import json
        if local_path and __import__("os").path.exists(local_path):
            with open(local_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"gh_load error: {e}")
    return None


def invalidate_all() -> None:
    """إلغاء الكاش — وهمي."""
    logger.debug("github_db.invalidate_all called (no-op)")


def upload_file(repo_path: str, file_bytes: bytes, commit_msg: str = "رفع ملف") -> bool:
    logger.debug(f"github_db.upload_file (no-op): {repo_path}")
    return False
