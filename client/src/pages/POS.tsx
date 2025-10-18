import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import POSLayout from "@/components/POSLayout";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  language: string;
}

interface Category {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  color: string;
  image_url: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  name_th: string;
  name_en: string;
  price: number;
  image_url: string | null;
  category_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Payment fields
  const [tableNo, setTableNo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'qr_code'>('cash');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLanguage(parsedUser.language || 'th');
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
      console.error(error);
      return;
    }

    setCategories(data || []);
  };

  const loadProducts = async (categoryId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .eq('is_active', true);

    if (error) {
      toast.error('ไม่สามารถโหลดสินค้าได้');
      console.error(error);
      return;
    }

    setProducts(data || []);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadProducts(categoryId);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success(`เพิ่ม ${language === 'th' ? product.name_th : product.name_en} ลงตะกร้า`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.07; // 7% VAT
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - discount;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('กรุณาเพิ่มสินค้าลงตะกร้า');
      return;
    }
    setIsPaymentOpen(true);
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          cashier_id: user.id,
          order_type: 'dine-in',
          status: 'pending',
          subtotal: getSubtotal(),
          tax_amount: getTax(),
          discount_amount: discount,
          total_amount: getTotal(),
          payment_method: paymentMethod,
          payment_status: 'paid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', order.id);

      toast.success('ชำระเงินสำเร็จ!');
      
      // Reset
      setCart([]);
      setTableNo('');
      setDiscount(0);
      setIsPaymentOpen(false);
      setIsCartOpen(false);
      setSelectedCategory(null);
      setProducts([]);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'th' ? 'en' : 'th');
  };

  return (
    <POSLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">POS System</h1>
            <p className="text-gray-400 mt-1">ระบบขายหน้าร้าน</p>
          </div>
          <div className="flex items-center gap-4">
            <RealtimeNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              {language === 'th' ? '🇹🇭 ไทย' : '🇬🇧 English'}
            </Button>
            {!selectedCategory && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-gray-800 border-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="bg-gray-800 border-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            )}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 relative"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              ตะกร้า ({cart.length})
              {cart.length > 0 && (
                <Badge className="ml-2 bg-red-500">{getTotal().toFixed(2)} ฿</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {!selectedCategory && (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {categories.map((category) => (
              <Card
                key={category.id}
                className="group cursor-pointer overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                style={{ backgroundColor: category.color || '#3B82F6' }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className={`p-6 ${viewMode === 'list' ? 'flex items-center gap-4' : 'text-center'} h-full`}>
                  <div className={`${viewMode === 'grid' ? 'w-20 h-20 mx-auto mb-4' : 'w-16 h-16'} bg-white/20 rounded-2xl flex items-center justify-center`}>
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {language === 'th' ? category.name_th : category.name_en}
                    </h3>
                    <p className="text-sm text-white/80">
                      {language === 'th' ? category.description_th : category.description_en}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {selectedCategory && (
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setProducts([]);
              }}
              className="mb-6 bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับ
            </Button>
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl bg-gray-800"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                    <div className={`${viewMode === 'grid' ? 'w-full h-32 mb-3' : 'w-24 h-24'} bg-gray-700 rounded-lg flex items-center justify-center`}>
                      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {language === 'th' ? product.name_th : product.name_en}
                      </h4>
                      <p className="text-2xl font-bold text-blue-400">
                        ฿{product.price.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] bg-gray-800 text-white border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-white">ตะกร้าสินค้า</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full pt-6">
            <ScrollArea className="flex-1 -mx-6 px-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>ตะกร้าว่างเปล่า</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <Card key={item.product.id} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">
                            {language === 'th' ? item.product.name_th : item.product.name_en}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-8 w-8 p-0 bg-gray-600 border-gray-500 hover:bg-gray-500"
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 p-0 bg-gray-600 border-gray-500 hover:bg-gray-500"
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-lg font-bold text-blue-400">
                            ฿{(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>ยอดรวม</span>
                  <span>฿{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>ภาษี (7%)</span>
                  <span>฿{getTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>รวมทั้งหมด</span>
                  <span>฿{getTotal().toFixed(2)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 text-lg"
                >
                  ชำระเงิน
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Sheet */}
      <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] bg-gray-800 text-white border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-white">ชำระเงิน</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full pt-6">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6">
                {/* Table Number */}
                <div>
                  <Label htmlFor="table" className="text-white">หมายเลขโต๊ะ</Label>
                  <Input
                    id="table"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    placeholder="T01"
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                  />
                </div>

                {/* Discount */}
                <div>
                  <Label htmlFor="discount" className="text-white">ส่วนลด (฿)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-white mb-3 block">วิธีการชำระเงิน</Label>
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                      <TabsTrigger value="cash">เงินสด</TabsTrigger>
                      <TabsTrigger value="credit_card">บัตร</TabsTrigger>
                      <TabsTrigger value="qr_code">QR Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cash" className="mt-4">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <svg className="w-16 h-16 mx-auto mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-white">รับชำระด้วยเงินสด</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="credit_card" className="mt-4">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <svg className="w-16 h-16 mx-auto mb-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <p className="text-white">รับชำระด้วยบัตรเครดิต/เดบิต</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="qr_code" className="mt-4">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <svg className="w-16 h-16 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="text-white">รับชำระด้วย QR Code</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Summary */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>ยอดรวม</span>
                      <span>฿{getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>ภาษี (7%)</span>
                      <span>฿{getTax().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>ส่วนลด</span>
                        <span>-฿{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between text-2xl font-bold text-white">
                        <span>รวมทั้งหมด</span>
                        <span>฿{getTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
              <Button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 text-lg"
              >
                ยืนยันการชำระเงิน ฿{getTotal().toFixed(2)}
              </Button>
              <Button
                onClick={() => setIsPaymentOpen(false)}
                variant="outline"
                className="w-full bg-gray-700 border-gray-600 hover:bg-gray-600"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </POSLayout>
  );
}

