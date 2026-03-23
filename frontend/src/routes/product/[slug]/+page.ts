import type { PageLoad } from './$types';
import { getProduct } from '$lib/api';

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	
	console.log('Loading product with slug:', slug);

	if (!slug) {
		return {
			product: null,
			error: 'Product not found'
		};
	}

	try {
		const res = await getProduct(slug);
		console.log('Product response:', res);
		return {
			product: res.data || null,
			error: res.error || null
		};
	} catch (e) {
		console.error('Error loading product:', e);
		return {
			product: null,
			error: 'Failed to load product'
		};
	}
};
