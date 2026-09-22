import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { apiGet } from '../../api/api'
import { useCart } from '../../context/CartContext'

import fullGujaratiThali from '../../../assets/menu/full-gujarati-thali.jpg'
import halfGujaratiThali from '../../../assets/menu/half-gujarati-thali.jpg'
import gujaratiDal from '../../../assets/menu/gujarati-dal.jpg'
import rotli from '../../../assets/menu/rotli.jpg'
import onlyRice from '../../../assets/menu/only-rice.jpg'
import paneerThali from '../../../assets/menu/paneer-thali.jpg'

type MenuItem = {
  id: number
  name: string
  description?: string
  price: number | string
  category?: string
  image?: string
  is_popular?: boolean
  is_available?: boolean
}

type MenuResponse = {
  success: boolean
  menuItems: MenuItem[]
}

const menuImages: Record<string, any> = {
  'full-gujarati-thali.jpg': fullGujaratiThali,
  'half-gujarati-thali.jpg': halfGujaratiThali,
  'gujarati-dal.jpg': gujaratiDal,
  'rotli.jpg': rotli,
  'only-rice.jpg': onlyRice,
  'paneer-thali.jpg': paneerThali,
}

const categoryOrder = [
  'Thali',
  'Dal',
  'Breads',
  'Rice',
  'Other',
]

export default function MenuScreen() {
  const { width: screenWidth } =
    useWindowDimensions()

  const {
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    getItemQuantity,
  } = useCart()

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    loadMenu()
  }, [])

  async function loadMenu() {
    try {
      setLoading(true)
      setError('')

      const response =
        await apiGet<MenuResponse>(
          '/api/orders/menu'
        )

      setMenuItems(
        response.menuItems || []
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to load menu right now. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(
    price: number | string
  ) {
    return Number(price).toFixed(0)
  }

  function getImage(image?: string) {
    if (!image) {
      return null
    }

    return menuImages[image] || null
  }

  const groupedItems =
    menuItems.reduce(
      (
        groups: Record<
          string,
          MenuItem[]
        >,
        item
      ) => {
        const category =
          item.category || 'Other'

        if (!groups[category]) {
          groups[category] = []
        }

        groups[category].push(item)

        return groups
      },
      {}
    )

  const categories =
    Object.keys(groupedItems).sort(
      (a, b) => {
        const aIndex =
          categoryOrder.indexOf(a)

        const bIndex =
          categoryOrder.indexOf(b)

        if (
          aIndex === -1 &&
          bIndex === -1
        ) {
          return a.localeCompare(b)
        }

        if (aIndex === -1) {
          return 1
        }

        if (bIndex === -1) {
          return -1
        }

        return aIndex - bIndex
      }
    )

  /*
   * RESPONSIVE GRID
   */

  const maxContentWidth = 1280

  const contentWidth =
    Math.min(
      screenWidth,
      maxContentWidth
    )

  const horizontalPadding = 16

  const innerWidth =
    contentWidth -
    horizontalPadding * 2

  let columns = 1

  if (screenWidth >= 1024) {
    columns = 3
  } else if (screenWidth >= 640) {
    columns = 2
  }

  const gridGap = 24

  const cardWidth =
    columns === 1
      ? innerWidth
      : (
          innerWidth -
          gridGap *
            (columns - 1)
        ) / columns

  /*
   * LOADING
   */

  if (
    loading &&
    menuItems.length === 0
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingText}>
          Loading our fresh menu...
        </Text>
      </View>
    )
  }

  /*
   * ERROR
   */

  if (
    error &&
    menuItems.length === 0
  ) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            onPress={loadMenu}
            style={
              styles.retryButton
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  /*
   * MENU
   */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,
          {
            maxWidth:
              maxContentWidth,
          },
        ]}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Our Menu
          </Text>

          <Text style={styles.title}>
            Fresh & Homemade
          </Text>

          <Text
            style={styles.subtitle}
          >
            Delicious homemade food
            prepared fresh with care.
          </Text>
        </View>

        {/* CATEGORIES */}

        <View style={styles.categories}>
          {categories.map(
            (category) => (
              <View
                key={category}
                style={
                  styles.categorySection
                }
              >
                {/* CATEGORY */}

                <View
                  style={
                    styles.categoryHeader
                  }
                >
                  <Text
                    style={
                      styles.categoryTitle
                    }
                  >
                    {category}
                  </Text>

                  <View
                    style={
                      styles.categoryLine
                    }
                  />
                </View>

                {/* GRID */}

                <View
                  style={[
                    styles.menuGrid,
                    {
                      gap: gridGap,
                    },
                  ]}
                >
                  {groupedItems[
                    category
                  ].map((item) => {
                    const quantity =
                      getItemQuantity(
                        item.id
                      )

                    const image =
                      getImage(
                        item.image
                      )

                    const isAvailable =
                      item.is_available !==
                      false

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.menuCard,
                          {
                            width:
                              cardWidth,
                          },
                        ]}
                      >
                        {/* IMAGE */}

                        <View
                          style={
                            styles.imageContainer
                          }
                        >
                          {image ? (
                            <Image
                              source={image}
                              style={
                                styles.image
                              }
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={
                                styles.noImage
                              }
                            >
                              <Text
                                style={
                                  styles.noImageEmoji
                                }
                              >
                                🍱
                              </Text>
                            </View>
                          )}

                          {item.is_popular ? (
                            <View
                              style={
                                styles.popularBadge
                              }
                            >
                              <Text
                                style={
                                  styles.popularText
                                }
                              >
                                Popular
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* CONTENT */}

                        <View
                          style={
                            styles.cardContent
                          }
                        >
                          {/* NAME + PRICE */}

                          <View
                            style={
                              styles.namePriceRow
                            }
                          >
                            <Text
                              style={
                                styles.itemName
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={
                                styles.price
                              }
                            >
                              ₹
                              {formatPrice(
                                item.price
                              )}
                            </Text>
                          </View>

                          {/* DESCRIPTION */}

                          {item.description ? (
                            <Text
                              style={
                                styles.description
                              }
                            >
                              {
                                item.description
                              }
                            </Text>
                          ) : null}

                          {/* ACTION */}

                          <View
                            style={
                              styles.actionContainer
                            }
                          >
                            {quantity ===
                            0 ? (
                              <Pressable
                                onPress={() =>
                                  addToCart(
                                    {
                                      id: item.id,
                                      name:
                                        item.name,
                                      description:
                                        item.description,
                                      price:
                                        Number(
                                          item.price
                                        ),
                                      image:
                                        item.image,
                                    }
                                  )
                                }
                                disabled={
                                  !isAvailable
                                }
                                style={[
                                  styles.addButton,
                                  !isAvailable &&
                                    styles.disabledButton,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.addButtonText,
                                    !isAvailable &&
                                      styles.disabledButtonText,
                                  ]}
                                >
                                  {isAvailable
                                    ? 'Add to Cart'
                                    : 'Unavailable'}
                                </Text>
                              </Pressable>
                            ) : (
                              <View
                                style={
                                  styles.quantityContainer
                                }
                              >
                                {/* MINUS */}

                                <Pressable
                                  onPress={() =>
                                    decreaseQuantity(
                                      item.id
                                    )
                                  }
                                  style={
                                    styles.quantityCircleLight
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

                                {/* QUANTITY */}

                                <Text
                                  style={
                                    styles.quantityText
                                  }
                                >
                                  {quantity}
                                </Text>

                                {/* PLUS */}

                                <Pressable
                                  onPress={() =>
                                    increaseQuantity(
                                      item.id
                                    )
                                  }
                                  style={
                                    styles.quantityCircleGreen
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
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  /*
   * PAGE
   */

  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /*
   * LOADING
   */

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF5',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },

  /*
   * ERROR
   */

  errorCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 24,
    alignItems: 'center',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /*
   * HEADER
   */

  header: {
    alignItems: 'center',
    marginBottom: 38,
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
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'center',
  },

  /*
   * CATEGORIES
   */

  categories: {
    width: '100%',
  },

  categorySection: {
    marginBottom: 42,
  },

  categoryHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  categoryTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    marginRight: 14,
  },

  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCFCE7',
  },

  /*
   * GRID
   */

  menuGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /*
   * CARD
   */

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,

    elevation: 2,
  },

  /*
   * IMAGE
   */

  imageContainer: {
    width: '100%',
    height: 224,
    backgroundColor: '#F0FDF4',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImageEmoji: {
    fontSize: 58,
  },

  /*
   * POPULAR
   */

  popularBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,

    elevation: 2,
  },

  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },

  /*
   * CARD CONTENT
   */

  cardContent: {
    padding: 20,
  },

  namePriceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  itemName: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#111827',
    paddingRight: 14,
  },

  price: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#2E7D32',
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },

  /*
   * ACTION
   */

  actionContainer: {
    width: '100%',
    marginTop: 20,
  },

  addButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  disabledButton: {
    backgroundColor: '#E5E7EB',
  },

  disabledButtonText: {
    color: '#6B7280',
  },

  /*
   * QUANTITY
   */

  quantityContainer: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    padding: 6,
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantityCircleLight: {
    width: 42,
    height: 42,
    borderRadius: 21,
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

  quantityCircleGreen: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '700',
    color: '#2E7D32',
  },

  plusText: {
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  quantityText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
})