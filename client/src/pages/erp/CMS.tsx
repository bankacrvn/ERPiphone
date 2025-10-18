import ERPLayout from "@/components/ERPLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CMS() {
  const [activeTab, setActiveTab] = useState("menu");

  return (
    <ERPLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Management System</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">จัดการเมนูอาหาร หมวดหมู่ และโต๊ะ</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="menu">เมนูอาหาร</TabsTrigger>
            <TabsTrigger value="categories">หมวดหมู่</TabsTrigger>
            <TabsTrigger value="tables">โต๊ะ</TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>จัดการเมนูอาหาร</CardTitle>
                    <CardDescription>เพิ่ม แก้ไข และจัดการเมนูอาหารในระบบ</CardDescription>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มเมนูใหม่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>คลิก "เพิ่มเมนูใหม่" เพื่อเริ่มต้น</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>จัดการหมวดหมู่</CardTitle>
                    <CardDescription>จัดการหมวดหมู่สินค้าและเมนู</CardDescription>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มหมวดหมู่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample categories will be loaded from database */}
                  <div className="text-center py-12 text-gray-500 col-span-full">
                    <p>กำลังโหลดหมวดหมู่...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>จัดการโต๊ะ</CardTitle>
                    <CardDescription>จัดการโต๊ะในร้านอาหาร</CardDescription>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มโต๊ะ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Sample tables will be loaded from database */}
                  <div className="text-center py-12 text-gray-500 col-span-full">
                    <p>กำลังโหลดโต๊ะ...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
}

