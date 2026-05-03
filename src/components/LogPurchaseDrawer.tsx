import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Calendar, ChevronDown, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface LogPurchaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialData?: any;
  title?: string;
  mode?: "create" | "edit" | "add-items";
}

export const LogPurchaseDrawer: React.FC<LogPurchaseDrawerProps> = ({ isOpen, onClose, onSuccess, initialData, title, mode = "create" }) => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliveryPaid, setDeliveryPaid] = useState("");
  const [deliveryDue, setDeliveryDue] = useState<number>(0);
  const [items, setItems] = useState<Item[]>([{ id: "1", name: "", quantity: 1, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<{ exists: boolean; customerName?: string; hasActiveStockpile?: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if initialData is provided
  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || "");
      setCustomerPhone(initialData.customerPhone || "");
      setCustomerEmail(initialData.customerEmail || "");
      if (initialData.endDate) {
        setEndDate(new Date(initialData.endDate).toISOString().split('T')[0]);
      }
      setDeliveryPaid(initialData.deliveryPaid ? "yes" : "no");
      setDeliveryDue(initialData.deliveryDue || 0);
      
      if (mode === "add-items") {
        setItems([{ id: "1", name: "", quantity: 1, price: 0 }]);
      } else if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })));
      }
    } else {
      // Reset form if no initialData
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setEndDate("");
      setDeliveryPaid("");
      setDeliveryDue(0);
      setItems([{ id: "1", name: "", quantity: 1, price: 0 }]);
    }
  }, [initialData, isOpen]);

  // Check for existing customer when phone number changes
  useEffect(() => {
    const checkCustomer = async () => {
      if (customerPhone.length >= 10) {
        try {
          const response = await fetchWithAuth(`/api/customers/check/${customerPhone}`);
          if (response.ok) {
            const data = await response.json();
            setExistingCustomer(data);
            if (data.exists && data.customerName && !customerName) {
              setCustomerName(data.customerName);
            }
            if (data.hasActiveStockpile && data.endDate) {
              setEndDate(new Date(data.endDate).toISOString().split('T')[0]);
            }
          }
        } catch (error) {
          console.error("Error checking customer:", error);
        }
      } else {
        setExistingCustomer(null);
      }
    };

    const timer = setTimeout(checkCustomer, 500);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName) newErrors.customerName = "Customer name is required";
    if (!customerPhone) newErrors.customerPhone = "Phone number is required";
    if (!endDate) newErrors.endDate = "Stockpile end date is required";
    if (!deliveryPaid) newErrors.deliveryPaid = "Delivery status is required";
    
    const invalidItems = items.some(item => !item.name || item.price <= 0 || item.quantity <= 0);
    if (invalidItems) newErrors.items = "Please fill in all item details correctly";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = initialData ? `/api/stockpiles/${initialData._id}` : "/api/stockpile/log";
      const method = initialData ? "PATCH" : "POST";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          endDate,
          deliveryPaid: deliveryPaid === "yes",
          deliveryDue: deliveryPaid === "no" ? deliveryDue : 0,
          items: items.map(({ name, price, quantity }) => ({ name, price, quantity })),
          totalAmount,
          appendItems: mode === "add-items"
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Reset form fields immediately
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setEndDate("");
        setDeliveryPaid("");
        setDeliveryDue(0);
        setItems([{ id: "1", name: "", quantity: 1, price: 0 }]);
        setExistingCustomer(null);
        setErrors({});
        
        // Notify parent to refresh data AND show success modal with data
        onSuccess(initialData ? { ...initialData, ...result } : result.stockpile);
        
        // Close the drawer immediately
        onClose();
      }
    } catch (error) {
      console.error("Failed to log purchase:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isFormValid = customerName && customerPhone && endDate && deliveryPaid && 
                      items.every(item => item.name && item.price > 0 && item.quantity > 0);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ 
              x: window.innerWidth >= 1024 ? "100%" : 0,
              y: window.innerWidth < 1024 ? "-100%" : 0 
            }}
            animate={{ x: 0, y: 0 }}
            exit={{ 
              x: window.innerWidth >= 1024 ? "100%" : 0,
              y: window.innerWidth < 1024 ? "-100%" : 0 
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full lg:w-[500px] bg-white z-[251] shadow-2xl flex flex-col overflow-hidden lg:rounded-l-[32px] rounded-b-[32px] lg:rounded-b-none"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold text-cartlist-orange">
                  {title || (mode === "add-items" ? "Add to stockpile" : initialData ? "Edit stockpile" : "Log a purchase")}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-gray-100">
                  <X className="w-6 h-6 text-gray-400" />
                </Button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <form id="log-purchase-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Existing Customer Notice */}
                  {existingCustomer?.exists && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3"
                    >
                      <Info className="w-5 h-5 text-blue-500 shrink-0" />
                      <p className="text-sm text-blue-700">
                        Existing customer found: <span className="font-bold">{existingCustomer.customerName}</span>. 
                        {existingCustomer.hasActiveStockpile 
                          ? " This purchase will be added to their active stockpile." 
                          : " They don't have an active stockpile. A new one will be created."}
                      </p>
                    </motion.div>
                  )}

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-sm font-bold text-gray-700">
                      Customer name<span className="text-blue-600">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="Enter name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`h-12 rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange ${errors.customerName ? "border-red-500" : ""}`}
                      required
                    />
                    {errors.customerName && <p className="text-xs text-red-500 font-medium">{errors.customerName}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-sm font-bold text-gray-700">
                      Customer phone number<span className="text-blue-600">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 border border-gray-200 rounded-xl bg-gray-50 h-12 min-w-[100px]">
                        <img src="https://flagcdn.com/w20/ng.png" alt="NG" className="w-5 h-3.5" />
                        <span className="text-sm font-medium">+234</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        id="customerPhone"
                        placeholder="(555) 000-0000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className={`h-12 rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange flex-1 ${errors.customerPhone ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {errors.customerPhone && <p className="text-xs text-red-500 font-medium">{errors.customerPhone}</p>}
                  </div>

                  {/* Email and Date Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-sm font-bold text-gray-700">
                        Email address<span className="text-gray-400 font-normal"> (Optional)</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="hello@mail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="h-12 rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-bold text-gray-700">
                        Stockpile end<span className="text-blue-600">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          disabled={mode === "add-items" || existingCustomer?.hasActiveStockpile}
                          className={`h-12 rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange pl-10 ${errors.endDate ? "border-red-500" : ""} ${(mode === "add-items" || existingCustomer?.hasActiveStockpile) ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          required
                        />
                        <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {errors.endDate && <p className="text-xs text-red-500 font-medium">{errors.endDate}</p>}
                    </div>
                  </div>

                  {/* Delivery Fee */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-700">Delivery fee paid?</Label>
                      <Select value={deliveryPaid} onValueChange={setDeliveryPaid}>
                        <SelectTrigger className={`h-12 w-full rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange ${errors.deliveryPaid ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.deliveryPaid && <p className="text-xs text-red-500 font-medium">{errors.deliveryPaid}</p>}
                    </div>

                    {deliveryPaid === "no" && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="deliveryDue" className="text-sm font-bold text-gray-700">Delivery amount due</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                          <Input
                            id="deliveryDue"
                            type="number"
                            placeholder="0.00"
                            value={deliveryDue || ""}
                            onChange={(e) => setDeliveryDue(parseFloat(e.target.value) || 0)}
                            className="h-12 rounded-xl border-gray-200 focus:ring-cartlist-orange focus:border-cartlist-orange pl-7"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Product Stockpile Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-gray-900">Product stockpile</h3>
                      <p className="text-xs text-gray-500">Enter in the item bought accordingly</p>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs font-bold text-gray-600">Item name</Label>
                              <Input
                                placeholder="item name"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                className="h-10 rounded-lg border-gray-200 bg-white"
                              />
                            </div>
                            <div className="w-20 space-y-2">
                              <Label className="text-xs font-bold text-gray-600">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="h-10 rounded-lg border-gray-200 bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs font-bold text-gray-600">Price per item</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={item.price || ""}
                                  onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                                  className="h-10 rounded-lg border-gray-200 bg-white pl-7"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-medium">Subtotal:</p>
                                <p className="text-sm font-bold">₦{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                              {items.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.items && <p className="text-xs text-red-500 font-medium">{errors.items}</p>}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="h-10 rounded-xl border-gray-200 text-gray-600 font-bold text-xs gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add item
                    </Button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 border-t border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg md:text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-lg md:text-xl font-black text-gray-900">₦{totalAmount.toLocaleString()}</span>
                </div>
                <Button
                  form="log-purchase-form"
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full h-14 rounded-2xl text-lg font-bold transition-all ${
                    isSubmitting || !isFormValid
                      ? "bg-orange-50 text-orange-200 cursor-not-allowed"
                      : "bg-cartlist-orange hover:bg-orange-600 text-white shadow-lg shadow-orange-100"
                  }`}
                >
                  {isSubmitting 
                    ? (mode === "add-items" ? "Adding..." : initialData ? "Updating..." : "Logging...") 
                    : (mode === "add-items" ? "Add to stockpile" : initialData ? "Update stockpile" : "Add purchase")}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
