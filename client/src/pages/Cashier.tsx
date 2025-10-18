import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import POSLayout from "@/components/POSLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Shift {
  id: string;
  shift_number: string;
  cashier_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
}

interface CashDrawerTransaction {
  id: string;
  shift_id: string;
  transaction_type: 'add' | 'withdraw' | 'sale' | 'refund';
  amount: number;
  description: string | null;
  created_at: string;
}

export default function Cashier() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<CashDrawerTransaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('0');
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isOpenShiftOpen, setIsOpenShiftOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [isWithdrawCashOpen, setIsWithdrawCashOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setLocation('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadCurrentShift(parsedUser.id);
  }, []);

  const loadCurrentShift = async (userId: string) => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('cashier_id', userId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading shift:', error);
      return;
    }

    if (data) {
      setCurrentShift(data);
      loadTransactions(data.id);
    }
  };

  const loadTransactions = async (shiftId: string) => {
    const { data, error } = await supabase
      .from('cash_drawer_transactions')
      .select('*')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  const handleOpenShift = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          cashier_id: user.id,
          opening_balance: parseFloat(openingBalance),
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentShift(data);
      setIsOpenShiftOpen(false);
      setOpeningBalance('0');
      toast.success('เปิดกะสำเร็จ');
    } catch (error) {
      console.error('Error opening shift:', error);
      toast.error('ไม่สามารถเปิดกะได้');
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_balance: parseFloat(closingBalance),
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentShift(null);
      setTransactions([]);
      setIsCloseShiftOpen(false);
      setClosingBalance('0');
      toast.success('ปิดกะสำเร็จ');
    } catch (error) {
      console.error('Error closing shift:', error);
      toast.error('ไม่สามารถปิดกะได้');
    }
  };

  const handleAddCash = async () => {
    if (!currentShift || !user) return;

    try {
      const { error } = await supabase
        .from('cash_drawer_transactions')
        .insert({
          shift_id: currentShift.id,
          transaction_type: 'add',
          amount: parseFloat(addAmount),
          description: description || 'เพิ่มเงินสด',
          created_by: user.id,
        });

      if (error) throw error;

      loadTransactions(currentShift.id);
      setIsAddCashOpen(false);
      setAddAmount('');
      setDescription('');
      toast.success('เพิ่มเงินสดสำเร็จ');
    } catch (error) {
      console.error('Error adding cash:', error);
      toast.error('ไม่สามารถเพิ่มเงินสดได้');
    }
  };

  const handleWithdrawCash = async () => {
    if (!currentShift || !user) return;

    try {
      const { error } = await supabase
        .from('cash_drawer_transactions')
        .insert({
          shift_id: currentShift.id,
          transaction_type: 'withdraw',
          amount: parseFloat(withdrawAmount),
          description: description || 'ถอนเงินสด',
          created_by: user.id,
        });

      if (error) throw error;

      loadTransactions(currentShift.id);
      setIsWithdrawCashOpen(false);
      setWithdrawAmount('');
      setDescription('');
      toast.success('ถอนเงินสดสำเร็จ');
    } catch (error) {
      console.error('Error withdrawing cash:', error);
      toast.error('ไม่สามารถถอนเงินสดได้');
    }
  };

  const getCurrentBalance = () => {
    if (!currentShift) return 0;
    
    const transactionSum = transactions.reduce((sum, t) => {
      if (t.transaction_type === 'add' || t.transaction_type === 'sale') {
        return sum + t.amount;
      } else if (t.transaction_type === 'withdraw' || t.transaction_type === 'refund') {
        return sum - t.amount;
      }
      return sum;
    }, 0);

    return currentShift.opening_balance + transactionSum;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'withdraw':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'sale':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'refund':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'add': return 'เพิ่มเงิน';
      case 'withdraw': return 'ถอนเงิน';
      case 'sale': return 'ขาย';
      case 'refund': return 'คืนเงิน';
      default: return type;
    }
  };

  return (
    <POSLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cashier System</h1>
            <p className="text-gray-400 mt-1">ระบบจัดการเงินสดและกะการทำงาน</p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-sm text-gray-400">แคชเชียร์</p>
              <p className="font-semibold">{user.full_name}</p>
            </div>
          )}
        </div>

        {/* Shift Status */}
        {!currentShift ? (
          <Card className="bg-gradient-to-br from-purple-900 to-blue-900 border-purple-700 mb-8">
            <CardContent className="p-8 text-center">
              <svg className="w-20 h-20 mx-auto mb-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">ไม่มีกะที่เปิดอยู่</h2>
              <p className="text-gray-300 mb-6">กรุณาเปิดกะเพื่อเริ่มการทำงาน</p>
              <Dialog open={isOpenShiftOpen} onOpenChange={setIsOpenShiftOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-6 text-lg">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เปิดกะ
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>เปิดกะใหม่</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      กรุณาระบุยอดเงินเริ่มต้นในลิ้นชัก
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="opening-balance">ยอดเงินเริ่มต้น (฿)</Label>
                      <Input
                        id="opening-balance"
                        type="number"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      onClick={handleOpenShift}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      ยืนยันเปิดกะ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Shift Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-200">ยอดเงินเริ่มต้น</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">฿{currentShift.opening_balance.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-200">ยอดเงินปัจจุบัน</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">฿{getCurrentBalance().toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-200">จำนวนธุรกรรม</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{transactions.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-200">เวลาเปิดกะ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {new Date(currentShift.opened_at).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Dialog open={isAddCashOpen} onOpenChange={setIsAddCashOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 py-6">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    เพิ่มเงินสด
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>เพิ่มเงินสด</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="add-amount">จำนวนเงิน (฿)</Label>
                      <Input
                        id="add-amount"
                        type="number"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-desc">หมายเหตุ</Label>
                      <Input
                        id="add-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <Button onClick={handleAddCash} className="w-full bg-green-600 hover:bg-green-700">
                      ยืนยัน
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isWithdrawCashOpen} onOpenChange={setIsWithdrawCashOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 py-6">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    ถอนเงินสด
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>ถอนเงินสด</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="withdraw-amount">จำนวนเงิน (฿)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-desc">หมายเหตุ</Label>
                      <Input
                        id="withdraw-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <Button onClick={handleWithdrawCash} className="w-full bg-red-600 hover:bg-red-700">
                      ยืนยัน
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 py-6">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ปิดกะ
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>ปิดกะ</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      กรุณานับเงินและระบุยอดเงินจริงในลิ้นชัก
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">ยอดเงินคาดหวัง:</span>
                        <span className="font-bold">฿{getCurrentBalance().toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="closing-balance">ยอดเงินจริง (฿)</Label>
                      <Input
                        id="closing-balance"
                        type="number"
                        value={closingBalance}
                        onChange={(e) => setClosingBalance(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-2"
                        placeholder="0.00"
                      />
                    </div>
                    {closingBalance && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-gray-300">ส่วนต่าง:</span>
                          <span className={`font-bold ${
                            parseFloat(closingBalance) - getCurrentBalance() >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            ฿{(parseFloat(closingBalance) - getCurrentBalance()).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleCloseShift}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      ยืนยันปิดกะ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Transactions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>ประวัติธุรกรรม</CardTitle>
                <CardDescription className="text-gray-400">
                  รายการเคลื่อนไหวเงินสดในกะนี้
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>ยังไม่มีธุรกรรม</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.transaction_type)}
                            <div>
                              <p className="font-semibold">
                                {getTransactionLabel(transaction.transaction_type)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {transaction.description || '-'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleString('th-TH')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              transaction.transaction_type === 'add' || transaction.transaction_type === 'sale'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              {transaction.transaction_type === 'add' || transaction.transaction_type === 'sale' ? '+' : '-'}
                              ฿{transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </POSLayout>
  );
}

