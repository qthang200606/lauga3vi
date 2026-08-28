import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Nâng cấp addToCart nhận thêm quantity và note
  const addToCart = (product, quantity = 1, note = "") => {
    setCartItems((prevItems) => {
      // Tìm sản phẩm cùng _id VÀ cùng ghi chú
      const existingIndex = prevItems.findIndex(
        (item) => item._id === product._id && item.note === note
      );

      if (existingIndex > 0 || existingIndex === 0) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            ...product,
            quantity: quantity,
            note: note,
          },
        ];
      }
    });
  };

  const updateQuantity = (id, note, amount) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item._id === id && item.note === note) {
            const newQty = item.quantity + amount;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id, note) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item._id === id && item.note === note))
    );
  };

  const clearCart = () => setCartItems([]);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;