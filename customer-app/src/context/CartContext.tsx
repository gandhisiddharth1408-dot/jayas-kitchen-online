import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

export type CartItem = {
  id: number
  name: string
  description?: string
  price: number
  image?: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (
    item: Omit<CartItem, 'quantity'>
  ) => void
  increaseQuantity: (id: number) => void
  decreaseQuantity: (id: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  getItemQuantity: (id: number) => number
  itemCount: number
  subtotal: number
  deliveryCharge: number
  total: number
}

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  )

const DELIVERY_CHARGE = 30

export function CartProvider({
  children,
}: {
  children: ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>([])

  function addToCart(
    item: Omit<CartItem, 'quantity'>
  ) {
    setItems((current) => {
      const existing = current.find(
        (cartItem) => cartItem.id === item.id
      )

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
              }
            : cartItem
        )
      }

      return [
        ...current,
        {
          ...item,
          quantity: 1,
        },
      ]
    })
  }

  function increaseQuantity(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  function decreaseQuantity(id: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(id: number) {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    )
  }

  function clearCart() {
    setItems([])
  }

  function getItemQuantity(id: number) {
    return (
      items.find(
        (item) => item.id === id
      )?.quantity || 0
    )
  }

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [items]
  )

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.price * item.quantity,
        0
      ),
    [items]
  )

  const deliveryCharge =
    items.length > 0
      ? DELIVERY_CHARGE
      : 0

  const total =
    subtotal + deliveryCharge

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        itemCount,
        subtotal,
        deliveryCharge,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    )
  }

  return context
}