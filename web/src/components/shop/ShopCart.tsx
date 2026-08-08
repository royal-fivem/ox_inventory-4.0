import React from 'react';
import { getItemUrl } from '../../helpers';
import { Locale } from '../../store/locale';
import { CartLine } from './types';

interface Props {
  lines: CartLine[];
  onChangeQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  onPay: (method: 'cash' | 'bank') => void;
}

const ShopCart: React.FC<Props> = ({ lines, onChangeQty, onRemove, onPay }) => {
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const symbol = Locale('$', '$');

  return (
    <div className="shop-cart">
      <div className="shop-cart-header">{Locale('ui_receipt_of_purchase', 'Receipt of Purchase')}</div>

      <div className="shop-cart-body">
        {lines.length === 0 && (
          <div className="shop-cart-empty">{Locale('ui_cart_empty', 'Your cart is empty')}</div>
        )}

        {lines.map((line) => (
          <div className="shop-cart-line" key={line.key}>
            <div
              className="shop-cart-line-img"
              style={{ backgroundImage: `url(${getItemUrl(line.product.name)})` }}
            />
            <div className="shop-cart-line-name">{line.product.label}</div>

            <div className="shop-cart-line-price">
              {symbol}
              {(line.product.price * line.quantity).toLocaleString('en-us')}
            </div>

            <div className="shop-qty small">
              <button className="shop-qty-btn" onClick={() => onChangeQty(line.key, -1)}>
                −
              </button>
              <span className="shop-qty-value">{line.quantity}</span>
              <button className="shop-qty-btn" onClick={() => onChangeQty(line.key, 1)}>
                +
              </button>
            </div>

            <button className="shop-cart-remove" onClick={() => onRemove(line.key)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="shop-cart-footer">
        <div className="shop-cart-total">
          <span>{Locale('ui_total', 'Total')}</span>
          <span className="shop-cart-total-value">
            {symbol}
            {total.toLocaleString('en-us')}
          </span>
        </div>

        <div className="shop-cart-pay">
          <button className="shop-pay-btn" disabled={lines.length === 0} onClick={() => onPay('bank')}>
            {Locale('ui_pay_with_card', 'Pay with Card')}
          </button>
          <button className="shop-pay-btn" disabled={lines.length === 0} onClick={() => onPay('cash')}>
            {Locale('ui_pay_with_cash', 'Pay with Cash')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopCart;
