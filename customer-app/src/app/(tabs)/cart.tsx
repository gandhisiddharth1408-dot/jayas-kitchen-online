import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useCart } from '../../context/CartContext'

export default function CartScreen() {
  const {
    items,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
    deliveryCharge,
    total,
  } = useCart()

  function formatPrice(price: number) {
    return price.toFixed(0)
  }

  /*
   * ==========================================
   * EMPTY CART
   * ==========================================
   */

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          🛒
        </Text>

        <Text style={styles.emptyTitle}>
          Your Cart is Empty
        </Text>

        <Text style={styles.emptySubtitle}>
          Add some delicious homemade food
          from our menu.
        </Text>
      </View>
    )
  }

  /*
   * ==========================================
   * CART
   * ==========================================
   */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Your Order
          </Text>

          <Text style={styles.title}>
            Your Cart
          </Text>

          <Text style={styles.subtitle}>
            Review your items before checkout.
          </Text>
        </View>

        {/* CART ITEMS */}

        <View style={styles.itemsSection}>
          {items.map((item) => (
            <View
              key={item.id}
              style={styles.cartCard}
            >
              {/* ITEM INFORMATION */}

              <View style={styles.itemTop}>
                <View style={styles.itemInfo}>
                  <Text
                    style={styles.itemName}
                  >
                    {item.name}
                  </Text>

                  {item.description ? (
                    <Text
                      style={
                        styles.itemDescription
                      }
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  <Text style={styles.itemPrice}>
                    ₹{formatPrice(item.price)}
                  </Text>
                </View>

                <Text style={styles.itemTotal}>
                  ₹
                  {formatPrice(
                    item.price *
                      item.quantity
                  )}
                </Text>
              </View>

              {/* QUANTITY CONTROLS */}

              <View
                style={styles.itemBottom}
              >
                <Pressable
                  onPress={() =>
                    decreaseQuantity(item.id)
                  }
                  style={
                    styles.quantityButtonLight
                  }
                >
                  <Text
                    style={
                      styles.minusText
                    }
                  >
                    −
                  </Text>
                </Pressable>

                <Text
                  style={styles.quantityText}
                >
                  {item.quantity}
                </Text>

                <Pressable
                  onPress={() =>
                    increaseQuantity(item.id)
                  }
                  style={
                    styles.quantityButtonGreen
                  }
                >
                  <Text
                    style={
                      styles.plusText
                    }
                  >
                    +
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    removeFromCart(item.id)
                  }
                  style={styles.removeButton}
                >
                  <Text
                    style={
                      styles.removeText
                    }
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* ORDER SUMMARY */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Order Summary
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              ₹{formatPrice(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery
            </Text>

            <Text style={styles.summaryValue}>
              ₹{formatPrice(deliveryCharge)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              ₹{formatPrice(total)}
            </Text>
          </View>
        </View>

        {/* CHECKOUT BUTTON */}

        <Pressable
          style={styles.checkoutButton}
          onPress={() => {
            // Checkout will be connected next.
          }}
        >
          <Text
            style={styles.checkoutButtonText}
          >
            Proceed to Checkout
          </Text>
        </Pressable>

        <Text style={styles.checkoutNote}>
          Delivery charge of ₹30 applies to
          your order.
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },

  /*
   * EMPTY CART
   */

  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 64,
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  emptySubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 340,
  },

  /*
   * HEADER
   */

  header: {
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 7,
  },

  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
  },

  /*
   * CART ITEMS
   */

  itemsSection: {
    width: '100%',
  },

  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 20,
    marginBottom: 16,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },

  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },

  itemName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#111827',
  },

  itemDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },

  itemPrice: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },

  itemTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },

  /*
   * QUANTITY
   */

  itemBottom: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButtonLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  quantityButtonGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  minusText: {
    fontSize: 23,
    fontWeight: '700',
    color: '#2E7D32',
  },

  plusText: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  quantityText: {
    minWidth: 42,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },

  removeButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  removeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },

  /*
   * ORDER SUMMARY
   */

  summaryCard: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 20,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },

  summaryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#4B5563',
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  divider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 6,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  totalLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
  },

  /*
   * CHECKOUT
   */

  checkoutButton: {
    width: '100%',
    height: 52,
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  checkoutNote: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
})