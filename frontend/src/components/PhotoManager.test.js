import { getPhotoUrl, getCoverUrl, handlePhotoError } from './PhotoManager';
jest.mock('../App', () => ({ api: {} }));
const url = 'https://res.cloudinary.com/demo/image/upload/hotel';
test('pipeline URLs remain absolute and usable at every size', () => {
 for (const size of ['mobile', 'web', 'hd']) expect(getPhotoUrl({url, thumb_url: url + '-thumb'}, size)).toBe(url);
 expect(getPhotoUrl({url, thumb_url: url + '-thumb'}, 'thumb')).toBe(url + '-thumb');
 expect(getCoverUrl([{url, is_primary:true}])).toBe(url);
});
test('canonical uploads and legacy strings still work', () => {
 expect(getPhotoUrl({cloudinary_mobile:url, url:'other'})).toBe(url);
 expect(getPhotoUrl(url)).toBe(url);
 expect(getPhotoUrl(null)).toBe('');
});
test('broken image fallback stops retrying', () => {
 const img = document.createElement('img'); img.src = url;
 handlePhotoError({currentTarget:img});
 expect(img.src).toContain('/placeholder-hotel.svg');
 const spy = jest.spyOn(img, 'src', 'set');
 handlePhotoError({currentTarget:img}); expect(spy).not.toHaveBeenCalled();
});
