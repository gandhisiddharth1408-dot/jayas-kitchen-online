import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'

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

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          🛒
        </Text>

        <Text style={styles.emptyTitle}>
          Your Cart is Empty
        </Text>

        <Text style={styles.emptyText}>
          Add some delicious homemade food from our
          menu to get started.
        </Text>

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() =>
            router.push('/(tabs)/menu')
          }
        >
          <Text style={styles.browseButtonText}>
            Browse Menu
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          {/* HEADER */}

          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              YOUR ORDER
            </Text>

            <Text style={styles.title}>
              Your Cart
            </Text>

            <Text style={styles.subtitle}>
              Review your items before checkout.
            </Text>
          </View>

          {/* CART ITEMS */}

          {items.map((item) => {
            const itemTotal =
              item.price * item.quantity

            return (
              <View
                key={item.id}
                style={styles.itemCard}
              >
                <View style={styles.itemTopRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.name}
                    </Text>

                    {item.description ? (
                      <Text
                        style={styles.itemDescription}
                      >
                        {item.description}
                      </Text>
                    ) : null}

                    <Text style={styles.unitPrice}>
                      ₹{item.price.toFixed(0)} each
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    ₹{itemTotal.toFixed(0)}
                  </Text>
                </View>

                <View style={styles.itemBottomRow}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        decreaseQuantity(item.id)
                      }
                    >
                      <Text
                        style={
                          styles.quantityButtonText
                        }
                      >
                        −
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        styles.quantityButtonPlus,
                      ]}
                      onPress={() =>
                        increaseQuantity(item.id)
                      }
                    >
                      <Text
                        style={[
                          styles.quantityButtonText,
                          styles.quantityButtonPlusText,
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      removeFromCart(item.id)
                    }
                  >
                    <Text style={styles.removeText}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}

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
                ₹{subtotal.toFixed(0)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery
              </Text>

              <Text style={styles.summaryValue}>
                ₹{deliveryCharge.toFixed(0)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                ₹{total.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* CHECKOUT BUTTON */}

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() =>
              router.push('/checkout')
            }
          >
            <Text style={styles.checkoutButtonText}>
              Proceed to Checkout
            </Text>
          </TouchableOpacity>

          <Text style={styles.deliveryNote}>
            Delivery charge of ₹30 applies to your order.
          </Text>

        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  container: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  header: {
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#2E7D32',
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  itemDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginTop: 5,
  },

  unitPrice: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700',
    marginTop: 8,
  },

  itemTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },

  itemBottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 24,
    padding: 4,
  },

  quantityButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  quantityButtonPlus: {
    backgroundColor: '#2E7D32',
  },

  quantityButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    lineHeight: 24,
  },

  quantityButtonPlusText: {
    color: '#FFFFFF',
  },

  quantityText: {
    minWidth: 42,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },

  removeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 24,
    padding: 18,
    marginTop: 2,
    marginBottom: 16,
  },

  summaryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
  },

  checkoutButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  deliveryNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 400,
  },

  browseButton: {
    marginTop: 24,
    minHeight: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  browseButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
})