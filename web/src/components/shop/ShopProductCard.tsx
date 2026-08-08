import React, { useState } from 'react';
import { getItemUrl } from '../../helpers';
import { Locale } from '../../store/locale';
import { ShopProduct } from './types';

interface Props {
  product: ShopProduct;
  onAdd: (product: ShopProduct, quantity: number) => void;
}

const ShopProductCard: React.FC<Props> = ({ product, onAdd }) => {
  const [qty, setQty] = useState(1);

  const stock = product.count;
  const soldOut = stock !== undefined && stock <= 0;
  const maxQty = stock !== undefined ? Math.max(1, stock) : 999;

  const clamp = (n: number) => Math.min(maxQty, Math.max(1, n));

  const currencySymbol =
    product.currency && product.currency !== 'money' ? '' : Locale('$', '$');

  return (
    <div className={`shop-card ${soldOut ? 'sold-out' : ''}`}>
      <div className="shop-card-left">
        <div
          className="shop-card-img"
          style={{ backgroundImage: `url(${getItemUrl(product.name)})` }}
        />
        <div className="shop-card-name">{product.label}</div>
      </div>

      <div className="shop-card-right">
        <div className="shop-card-price">
          {currencySymbol}
          {product.price.toLocaleString('en-us')}
        </div>

        <div className="shop-card-controls">
          <div className="shop-qty">
            <button
              className="shop-qty-btn"
              disabled={soldOut}
              onClick={() => setQty((q) => clamp(q - 1))}
            >
              −
            </button>
            <span className="shop-qty-value">{soldOut ? 0 : qty}</span>
            <button
              className="shop-qty-btn"
              disabled={soldOut}
              onClick={() => setQty((q) => clamp(q + 1))}
            >
              +
            </button>
          </div>

          <button
            className="shop-add-btn"
            disabled={soldOut}
            onClick={() => onAdd(product, qty)}
          >
            {soldOut ? Locale('ui_sold_out', 'Sold Out') : Locale('ui_add_to_cart', 'Add to Cart')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopProductCard;
