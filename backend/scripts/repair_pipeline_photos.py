"""Back up and normalize legacy imported photos. Defaults to dry run; use --apply."""
import argparse
import asyncio
import json
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy import text


def normalize(photos):
    result = []
    for i, original in enumerate(photos or []):
        p = dict(original) if isinstance(original, dict) else original
        if isinstance(p, dict) and p.get('url', '').startswith('https://'):
            p.setdefault('id', str(uuid4()))
            p.setdefault('sort_order', i)
            for size in ('original', 'thumb', 'mobile', 'web', 'hd'):
                if not p.get('cloudinary_' + size):
                    p['cloudinary_' + size] = p.get(size + '_url') or p['url']
        result.append(p)
    if result and all(isinstance(p, dict) for p in result) and not any(p.get('is_primary') for p in result):
        result[0]['is_primary'] = True
    return result


async def repair(apply=False, backup_dir=None):
    from database import engine
    try:
        async with engine.begin() as conn:
            rows = (await conn.execute(text("SELECT id, name, photos FROM hotels WHERE data_source='pipeline_scrape' FOR UPDATE"))).mappings().all()
            changes = [(dict(row), normalize(row['photos'])) for row in rows]
            changes = [(row, photos) for row, photos in changes if photos != row['photos']]
            print(json.dumps({'mode': 'apply' if apply else 'dry-run', 'hotels': len(changes), 'photos': sum(len(p) for _, p in changes)}))
            if apply and changes:
                target = Path(backup_dir or '.') / ('photos-backup-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.json')
                target.write_text(json.dumps([row for row, _ in changes], default=str, indent=2), encoding='utf-8')
                print('Backup:', target.resolve())
                for row, photos in changes:
                    await conn.execute(text('UPDATE hotels SET photos=CAST(:photos AS json) WHERE id=:id'), {'id': row['id'], 'photos': json.dumps(photos)})
        print('Transaction committed' if apply else 'No data changed')
    finally:
        await engine.dispose()


if __name__ == '__main__':
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--backup-dir')
    args = parser.parse_args()
    asyncio.run(repair(args.apply, args.backup_dir))
