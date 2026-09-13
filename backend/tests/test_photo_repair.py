import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('repair', Path(__file__).parents[1] / 'scripts/repair_pipeline_photos.py')
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)


def test_legacy_repair_preserves_urls_and_is_idempotent():
    old = [{'url':'https://res.cloudinary.com/demo/image/upload/a', 'thumb_url':'https://res.cloudinary.com/demo/image/upload/thumb', 'is_primary':True}]
    new = repair.normalize(old)
    assert new[0]['cloudinary_web'] == old[0]['url']
    assert new[0]['cloudinary_thumb'] == old[0]['thumb_url']
    assert new[0]['id'] and new[0]['sort_order'] == 0
    assert repair.normalize(new) == new
    assert 'id' not in old[0]


def test_repair_does_not_prefix_public_ids_or_local_paths():
    old = [{'url':'local/photo.jpg', 'is_primary':True}]
    assert repair.normalize(old) == old
