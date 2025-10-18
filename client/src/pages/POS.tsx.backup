import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import RealtimeNotifications from "@/components/RealtimeNotifications";

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
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [language, setLanguage] = useState<'th' | 'en'>('th');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setLocation('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLanguage(parsedUser.language || 'th');
    loadCategories();
  }, [setLocation]);

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

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('ออกจากระบบสำเร็จ');
    setLocation('/');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'th' ? 'en' : 'th');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-gray-800 flex flex-col items-center py-6 space-y-6 border-r border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          onClick={() => setLocation('/welcome')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl hover:bg-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl hover:bg-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl hover:bg-gray-700"
          onClick={handleLogout}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </Button>
      </aside>

      {/* Main Content */}
      <main className="ml-20 p-8">
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
            <Button
              onClick={() => setIsCartOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 relative"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              ตะกร้า ({cart.length})
              {cart.length > 0 && (
                <Badge className="ml-2 bg-red-500">{getTotalAmount().toFixed(2)} ฿</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="group cursor-pointer overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                style={{ backgroundColor: category.color || '#3B82F6' }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {language === 'th' ? category.name_th : category.name_en}
                    </h3>
                    <p className="text-sm text-white/80">
                      {language === 'th' ? category.description_th : category.description_en}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    View Items
                  </Button>
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
              onClick={() => setSelectedCategory(null)}
              className="mb-6 bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับ
            </Button>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl bg-gray-800"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white mb-1">
                      {language === 'th' ? product.name_th : product.name_en}
                    </h4>
                    <p className="text-lg font-bold text-blue-400">
                      ฿{product.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-gray-800 text-white border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-white">ตะกร้าสินค้า</SheetTitle>
            <SheetDescription className="text-gray-400">
              รายการสินค้าที่เลือก
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-gray-600 border-gray-500 hover:bg-gray-500"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-gray-600 border-gray-500 hover:bg-gray-500"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <p className="font-bold text-blue-400">
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
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-800 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">ยอดรวม:</span>
                <span className="text-2xl font-bold text-blue-400">
                  ฿{getTotalAmount().toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold h-12"
                onClick={() => toast.success('กำลังดำเนินการชำระเงิน...')}
              >
                ชำระเงิน
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

