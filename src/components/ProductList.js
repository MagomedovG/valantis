import React, { useState, useEffect } from 'react';
import axios from 'axios';
import md5 from "md5";

const API_URL = 'https://api.valantis.store:41000/';
const PASSWORD = 'Valantis';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [currentPage, searchQuery, minPrice, maxPrice, brandFilter]);

    const fetchProducts = async () => {
        setLoading(true); // Устанавливаем загрузку в true перед запросом
        try {
            const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const authString = md5(`${PASSWORD}_${timestamp}`);

            const response = await axios.post(API_URL, {
                action: 'get_ids',
                params: { offset: (currentPage - 1) * 50, limit: 50, search: searchQuery, min_price: minPrice, max_price: maxPrice, brand: brandFilter }
            }, {
                headers: {
                    'X-Auth': authString
                }
            });

            const ids = response.data.result;
            const uniqueIds = [...new Set(ids)]; // Ensure unique IDs

            const productsData = await Promise.all(uniqueIds.map(id => getProductDetails(id, authString)));
            setProducts(productsData.filter(product => product !== null)); // Filter out null values

            // Calculate total pages based on total products count
            const totalProductsCount = response.data.result.length;
            console.log(totalProductsCount);

            setTotalPages(Math.ceil(totalProductsCount / 10));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false); // Устанавливаем загрузку в false после получения данных
        }
    };

    const getProductDetails = async (id, authString) => {
        try {
            const response = await axios.post(API_URL, {
                action: 'get_items',
                params: { ids: [id] }
            }, {
                headers: {
                    'X-Auth': authString
                }
            });

            const productData = response.data.result[0];
            return productData ? productData : null; // Return null if no product data
        } catch (error) {
            console.error('Error fetching product details:', error);
            return null;
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleMinPriceChange = (e) => {
        setMinPrice(e.target.value);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPrice(e.target.value);
    };

    const handleBrandFilterChange = (e) => {
        setBrandFilter(e.target.value);
    };

    const handleFilterApply = () => {
        setCurrentPage(1);
        fetchProducts();
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div>
            <h1>Product List</h1>
            <div>
                <label>Search: </label>
                <input type="text" value={searchQuery} onChange={handleSearchChange} />
            </div>
            <div>
                <label>Min Price: </label>
                <input type="text" value={minPrice} onChange={handleMinPriceChange} />
                <label>Max Price: </label>
                <input type="text" value={maxPrice} onChange={handleMaxPriceChange} />
            </div>
            <div>
                <label>Brand: </label>
                <input type="text" value={brandFilter} onChange={handleBrandFilterChange} />
            </div>
            <button onClick={handleFilterApply}>Apply Filter</button>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    <ul>
                        {products.map((product, index) => (
                            <li className='product_item' key={product ? product.id : index}>
                                {product && (
                                    <div>
                                        <strong>ID:</strong> {product.id}<br />
                                        <strong>Name:</strong> {product.product}<br />
                                        <strong>Price:</strong> {product.price}<br />
                                        <strong>Brand:</strong> {product.brand || 'Unknown'}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => handlePageChange(page)}>Page {page}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
