export type Locale = "ar" | "en";

export const LOCALE_STORAGE_KEY = "app_locale";
export const DEFAULT_LOCALE: Locale = "ar";

export type MessageKey =
  | "lang.label"
  | "lang.ar"
  | "lang.en"
  | "app.title"
  | "app.tagline"
  | "app.loggedInAs"
  | "nav.employeeSection"
  | "nav.clients"
  | "nav.shippingCompanies"
  | "nav.addTransaction"
  | "nav.logout"
  | "list.loadError"
  | "list.col.client"
  | "list.col.shippingCompany"
  | "list.col.declaration"
  | "list.col.status"
  | "list.col.channel"
  | "list.col.value"
  | "list.col.createdAt"
  | "list.empty"
  | "list.searchPlaceholder"
  | "list.filterAllStatuses"
  | "list.filterAllChannels"
  | "list.noResults"
  | "notFound.title"
  | "notFound.dashboard"
  | "login.title"
  | "login.subtitle"
  | "login.email"
  | "login.password"
  | "login.submit"
  | "login.submitting"
  | "login.error"
  | "login.demoHint"
  | "employees.title"
  | "employees.currentRole"
  | "employees.roleFromAccount"
  | "employees.managerTitle"
  | "employees.managerDesc"
  | "employees.employeeTitle"
  | "employees.employeeDesc"
  | "employees.accountantTitle"
  | "employees.accountantDesc"
  | "employees.goTracker"
  | "employees.back"
  | "employees.managerOnly"
  | "employees.name"
  | "employees.email"
  | "employees.password"
  | "employees.passwordHintEdit"
  | "employees.role"
  | "employees.loadError"
  | "employees.saveError"
  | "employees.deleteError"
  | "employees.deleteConfirm"
  | "employees.create"
  | "employees.update"
  | "employees.edit"
  | "employees.delete"
  | "employees.cancelEdit"
  | "employees.empty"
  | "employees.actions"
  | "employees.emailTaken"
  | "employees.lastManagerRole"
  | "employees.lastManagerDelete"
  | "employees.deleteSelfError"
  | "form.back"
  | "form.newTitle"
  | "form.editTitle"
  | "form.accessLimitedTitle"
  | "form.accessLimitedBody"
  | "form.loadError"
  | "form.saveError"
  | "form.clientName"
  | "form.shippingCompanyName"
  | "form.shippingCompanyId"
  | "form.airwayBill"
  | "form.hsCode"
  | "form.origin"
  | "form.invoiceValue"
  | "form.documentStatus"
  | "form.paymentStatus"
  | "form.goodsDescription"
  | "form.save"
  | "form.saving"
  | "form.invoiceToWeightRate"
  | "form.invoiceToWeightRateHint"
  | "form.goodsWeightKg"
  | "form.derivedWeight"
  | "form.containerCount"
  | "form.containerArrivalDate"
  | "form.documentArrivalDate"
  | "form.documentPostalNumber"
  | "form.goodsQuantity"
  | "form.goodsQuality"
  | "form.goodsUnit"
  | "form.optionalSelect"
  | "form.quality.new"
  | "form.quality.like_new"
  | "form.quality.used"
  | "form.quality.refurbished"
  | "form.quality.damaged"
  | "form.quality.mixed"
  | "form.unit.kg"
  | "form.unit.ton"
  | "form.unit.piece"
  | "form.unit.carton"
  | "form.unit.pallet"
  | "form.unit.cbm"
  | "form.unit.liter"
  | "form.unit.set"
  | "form.documentPhotosHelp"
  | "form.documentPhotosSection"
  | "form.removeAttachment"
  | "form.filesSelected"
  | "details.title"
  | "details.back"
  | "details.edit"
  | "details.delete"
  | "details.deleting"
  | "details.markPaid"
  | "details.release"
  | "details.loadError"
  | "details.deleteError"
  | "details.deleteConfirm"
  | "details.actionError"
  | "details.loading"
  | "details.client"
  | "details.shippingCompany"
  | "details.createdAt"
  | "details.declaration"
  | "details.airwayBill"
  | "details.hsCode"
  | "details.goods"
  | "details.origin"
  | "details.invoiceValue"
  | "details.currencySuffix"
  | "details.duty"
  | "details.risk"
  | "details.channel"
  | "details.document"
  | "details.status"
  | "details.payment"
  | "details.releaseCode"
  | "details.notIssued"
  | "details.containerCount"
  | "details.goodsWeightKg"
  | "details.invoiceToWeightRate"
  | "details.containerArrivalDate"
  | "details.documentArrivalDate"
  | "details.documentPostalNumber"
  | "details.goodsQuantity"
  | "details.goodsQuality"
  | "details.goodsUnit"
  | "details.documentPhotos"
  | "details.openAttachment"
  | "role.manager"
  | "role.employee"
  | "role.accountant"
  | "clients.title"
  | "clients.back"
  | "clients.managerOnly"
  | "clients.loadError"
  | "clients.saveError"
  | "clients.deleteError"
  | "clients.deleteConfirm"
  | "clients.companyName"
  | "clients.trn"
  | "clients.immigrationCode"
  | "clients.clientEmail"
  | "clients.country"
  | "clients.creditLimit"
  | "clients.status"
  | "clients.actions"
  | "clients.create"
  | "clients.update"
  | "clients.edit"
  | "clients.delete"
  | "clients.empty"
  | "clients.active"
  | "clients.suspended"
  | "shipping.title"
  | "shipping.back"
  | "shipping.managerOnly"
  | "shipping.loadError"
  | "shipping.saveError"
  | "shipping.deleteError"
  | "shipping.deleteConfirm"
  | "shipping.companyName"
  | "shipping.code"
  | "shipping.contactName"
  | "shipping.phone"
  | "shipping.email"
  | "shipping.location"
  | "shipping.mapClickHint"
  | "shipping.clearLocation"
  | "shipping.viewOnMap"
  | "shipping.status"
  | "shipping.actions"
  | "shipping.create"
  | "shipping.update"
  | "shipping.edit"
  | "shipping.delete"
  | "shipping.empty"
  | "shipping.active"
  | "shipping.inactive";

const messages: Record<Locale, Record<MessageKey, string>> = {
  ar: {
    "lang.label": "اللغة",
    "lang.ar": "العربية",
    "lang.en": "English",
    "app.title": "متتبع المعاملات",
    "app.tagline": "إنشاء المعاملات وتعديلها وإدارتها بالكامل.",
    "app.loggedInAs": "مسجّل الدخول",
    "nav.employeeSection": "قسم الموظفين",
    "nav.clients": "العملاء",
    "nav.shippingCompanies": "شركات الشحن",
    "nav.addTransaction": "إضافة معاملة جديدة",
    "nav.logout": "تسجيل الخروج",
    "list.loadError": "تعذر تحميل المعاملات. هل يعمل الخادم على المنفذ 4000؟",
    "list.col.client": "العميل",
    "list.col.shippingCompany": "شركة الشحن",
    "list.col.declaration": "رقم الإقرار",
    "list.col.status": "الحالة",
    "list.col.channel": "القناة",
    "list.col.value": "القيمة (درهم)",
    "list.col.createdAt": "تاريخ الإنشاء",
    "list.empty": "لا توجد معاملات بعد. أضف أول معاملة.",
    "list.searchPlaceholder": "بحث تلقائي: عميل، شركة شحن، إقرار، بوليصة...",
    "list.filterAllStatuses": "كل الحالات",
    "list.filterAllChannels": "كل القنوات",
    "list.noResults": "لا توجد نتائج مطابقة للبحث/الفلاتر.",
    "notFound.title": "الصفحة غير موجودة",
    "notFound.dashboard": "الانتقال إلى لوحة التحكم",
    "login.title": "تسجيل الدخول",
    "login.subtitle": "سجّل الدخول للوصول إلى متتبع المعاملات.",
    "login.email": "البريد الإلكتروني",
    "login.password": "كلمة المرور",
    "login.submit": "دخول",
    "login.submitting": "جاري تسجيل الدخول…",
    "login.error": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "login.demoHint":
      "حسابات تجريبية: manager@tracker.local / 123456، employee@tracker.local / 123456، accountant@tracker.local / 123456",
    "employees.title": "قسم الموظفين",
    "employees.currentRole": "الدور الحالي",
    "employees.roleFromAccount": "يُحدَّد الدور من حساب تسجيل الدخول.",
    "employees.managerTitle": "مدير",
    "employees.managerDesc": "صلاحيات كاملة: إنشاء، تعديل، حذف، الدفع، والإفراج.",
    "employees.employeeTitle": "موظف",
    "employees.employeeDesc": "إدارة المعاملات ما عدا المحاسبة والفوترة.",
    "employees.accountantTitle": "محاسب",
    "employees.accountantDesc": "إدارة المحاسبة والفوترة (الدفع والإفراج).",
    "employees.goTracker": "الذهاب إلى متتبع المعاملات",
    "employees.back": "العودة",
    "employees.managerOnly": "إضافة الموظفين وتعديلهم وحذفهم متاح للمدير فقط.",
    "employees.name": "الاسم",
    "employees.email": "البريد الإلكتروني",
    "employees.password": "كلمة المرور",
    "employees.passwordHintEdit": "اتركه فارغًا للإبقاء على كلمة المرور الحالية.",
    "employees.role": "الدور",
    "employees.loadError": "تعذر تحميل الموظفين.",
    "employees.saveError": "تعذر حفظ بيانات الموظف.",
    "employees.deleteError": "تعذر حذف الموظف.",
    "employees.deleteConfirm": "حذف هذا الموظف؟",
    "employees.create": "إضافة موظف",
    "employees.update": "تحديث الموظف",
    "employees.edit": "تعديل",
    "employees.delete": "حذف",
    "employees.cancelEdit": "إلغاء",
    "employees.empty": "لا يوجد موظفون.",
    "employees.actions": "الإجراءات",
    "employees.emailTaken": "هذا البريد مستخدم بالفعل.",
    "employees.lastManagerRole": "لا يمكن تغيير دور المدير الوحيد.",
    "employees.lastManagerDelete": "لا يمكن حذف المدير الوحيد.",
    "employees.deleteSelfError": "لا يمكن حذف حسابك الحالي.",
    "form.back": "العودة للقائمة",
    "form.newTitle": "معاملة جديدة",
    "form.editTitle": "تعديل المعاملة",
    "form.accessLimitedTitle": "صلاحية محدودة",
    "form.accessLimitedBody": "دور المحاسب مقصور على عمليات المحاسبة والفوترة من صفحة تفاصيل المعاملة.",
    "form.loadError": "تعذر تحميل المعاملة",
    "form.saveError": "تعذر حفظ المعاملة",
    "form.clientName": "اسم العميل",
    "form.shippingCompanyName": "اسم شركة الشحن",
    "form.shippingCompanyId": "معرف شركة الشحن",
    "form.airwayBill": "بوليصة الشحن / الرقم",
    "form.hsCode": "رمز HS",
    "form.origin": "بلد المنشأ",
    "form.invoiceValue": "قيمة الفاتورة",
    "form.documentStatus": "حالة المستند",
    "form.paymentStatus": "حالة الدفع",
    "form.goodsDescription": "وصف البضائع",
    "form.save": "حفظ المعاملة",
    "form.saving": "جاري الحفظ…",
    "form.invoiceToWeightRate": "سعر التحويل (درهم لكل كجم)",
    "form.invoiceToWeightRateHint": "قسمة قيمة الفاتورة على هذا السعر = الوزن",
    "form.goodsWeightKg": "وزن البضائع (كجم)",
    "form.derivedWeight": "محسوب",
    "form.containerCount": "عدد الحاويات",
    "form.containerArrivalDate": "تاريخ وصول الحاوية",
    "form.documentArrivalDate": "تاريخ وصول المستندات",
    "form.documentPostalNumber": "الرقم البريدي للمستندات",
    "form.goodsQuantity": "كمية البضائع",
    "form.goodsQuality": "جودة البضائع",
    "form.goodsUnit": "وحدة القياس",
    "form.optionalSelect": "— اختر —",
    "form.quality.new": "جديد",
    "form.quality.like_new": "شبه جديد",
    "form.quality.used": "مستعمل",
    "form.quality.refurbished": "مجدّد",
    "form.quality.damaged": "تالف",
    "form.quality.mixed": "مختلط",
    "form.unit.kg": "كيلوغرام",
    "form.unit.ton": "طن",
    "form.unit.piece": "قطعة",
    "form.unit.carton": "كرتون",
    "form.unit.pallet": "منصّة",
    "form.unit.cbm": "م³ (CBM)",
    "form.unit.liter": "لتر",
    "form.unit.set": "طقم",
    "form.documentPhotosHelp": "إرفاق صور أو ملفات PDF للمستندات (اختياري).",
    "form.documentPhotosSection": "مرفقات المستندات",
    "form.removeAttachment": "إزالة",
    "form.filesSelected": "ملف(ات) جديدة للرفع",
    "details.title": "تفاصيل المعاملة",
    "details.back": "العودة للقائمة",
    "details.edit": "تعديل",
    "details.delete": "حذف",
    "details.deleting": "جاري الحذف…",
    "details.markPaid": "تمييز كمدفوع",
    "details.release": "إصدار الإفراج",
    "details.loadError": "تعذر تحميل تفاصيل المعاملة.",
    "details.deleteError": "تعذر حذف المعاملة.",
    "details.deleteConfirm": "حذف هذه المعاملة؟",
    "details.actionError": "فشلت العملية. تحقق من الصلاحيات أو المتطلبات.",
    "details.loading": "جاري التحميل…",
    "details.client": "العميل",
    "details.shippingCompany": "شركة الشحن",
    "details.createdAt": "تاريخ الإنشاء",
    "details.declaration": "الإقرار",
    "details.airwayBill": "بوليصة الشحن",
    "details.hsCode": "رمز HS",
    "details.goods": "البضائع",
    "details.origin": "المنشأ",
    "details.invoiceValue": "قيمة الفاتورة",
    "details.currencySuffix": "درهم",
    "details.duty": "الرسوم",
    "details.risk": "المخاطر",
    "details.channel": "القناة",
    "details.document": "المستند",
    "details.status": "الحالة",
    "details.payment": "الدفع",
    "details.releaseCode": "رمز الإفراج",
    "details.notIssued": "لم يُصدر",
    "details.containerCount": "عدد الحاويات",
    "details.goodsWeightKg": "وزن البضائع (كجم)",
    "details.invoiceToWeightRate": "سعر التحويل (درهم/كجم)",
    "details.containerArrivalDate": "وصول الحاوية",
    "details.documentArrivalDate": "وصول المستندات",
    "details.documentPostalNumber": "الرقم البريدي",
    "details.goodsQuantity": "الكمية",
    "details.goodsQuality": "الجودة",
    "details.goodsUnit": "وحدة القياس",
    "details.documentPhotos": "مرفقات المستندات",
    "details.openAttachment": "فتح",
    "role.manager": "مدير",
    "role.employee": "موظف",
    "role.accountant": "محاسب",
    "clients.title": "قسم العملاء",
    "clients.back": "العودة",
    "clients.managerOnly": "التعديل والإدارة متاحة للمدير فقط.",
    "clients.loadError": "تعذر تحميل العملاء.",
    "clients.saveError": "تعذر حفظ بيانات العميل.",
    "clients.deleteError": "تعذر حذف العميل.",
    "clients.deleteConfirm": "هل تريد حذف هذا العميل؟",
    "clients.companyName": "اسم الشركة",
    "clients.trn": "هاتف جهة الاتصال",
    "clients.immigrationCode": "معرّف العميل",
    "clients.clientEmail": "البريد الإلكتروني للعميل",
    "clients.country": "الدولة",
    "clients.creditLimit": "الحد الائتماني",
    "clients.status": "الحالة",
    "clients.actions": "الإجراءات",
    "clients.create": "إضافة عميل",
    "clients.update": "تحديث العميل",
    "clients.edit": "تعديل",
    "clients.delete": "حذف",
    "clients.empty": "لا يوجد عملاء.",
    "clients.active": "نشط",
    "clients.suspended": "موقوف",
    "shipping.title": "قسم شركات الشحن",
    "shipping.back": "العودة",
    "shipping.managerOnly": "التعديل والإدارة متاحة للمدير فقط.",
    "shipping.loadError": "تعذر تحميل شركات الشحن.",
    "shipping.saveError": "تعذر حفظ بيانات شركة الشحن.",
    "shipping.deleteError": "تعذر حذف شركة الشحن.",
    "shipping.deleteConfirm": "هل تريد حذف شركة الشحن هذه؟",
    "shipping.companyName": "اسم الشركة",
    "shipping.code": "الكود",
    "shipping.contactName": "اسم جهة الاتصال",
    "shipping.phone": "الهاتف",
    "shipping.email": "البريد الإلكتروني",
    "shipping.location": "الموقع",
    "shipping.mapClickHint": "انقر على الخريطة لتحديد موقع المكتب.",
    "shipping.clearLocation": "إزالة الموقع",
    "shipping.viewOnMap": "عرض على الخريطة",
    "shipping.status": "الحالة",
    "shipping.actions": "الإجراءات",
    "shipping.create": "إضافة شركة شحن",
    "shipping.update": "تحديث شركة الشحن",
    "shipping.edit": "تعديل",
    "shipping.delete": "حذف",
    "shipping.empty": "لا توجد شركات شحن.",
    "shipping.active": "نشط",
    "shipping.inactive": "غير نشط",
  },
  en: {
    "lang.label": "Language",
    "lang.ar": "العربية",
    "lang.en": "English",
    "app.title": "Transaction Tracker",
    "app.tagline": "Create, edit, and fully manage transactions.",
    "app.loggedInAs": "Logged in as",
    "nav.employeeSection": "Employee Section",
    "nav.clients": "Clients",
    "nav.shippingCompanies": "Shipping Companies",
    "nav.addTransaction": "Add New Transaction",
    "nav.logout": "Logout",
    "list.loadError": "Unable to load transactions. Is API running on port 4000?",
    "list.col.client": "Client",
    "list.col.shippingCompany": "Shipping Company",
    "list.col.declaration": "Declaration",
    "list.col.status": "Status",
    "list.col.channel": "Channel",
    "list.col.value": "Value (AED)",
    "list.col.createdAt": "Created At",
    "list.empty": "No transactions yet. Add your first transaction.",
    "list.searchPlaceholder": "Auto search: client, shipping company, declaration, airway bill...",
    "list.filterAllStatuses": "All statuses",
    "list.filterAllChannels": "All channels",
    "list.noResults": "No results match current search/filters.",
    "notFound.title": "Page not found",
    "notFound.dashboard": "Go to dashboard",
    "login.title": "Login",
    "login.subtitle": "Sign in to access the transaction tracker.",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Login",
    "login.submitting": "Signing in…",
    "login.error": "Invalid email or password.",
    "login.demoHint":
      "Demo accounts: manager@tracker.local / 123456, employee@tracker.local / 123456, accountant@tracker.local / 123456",
    "employees.title": "Employee Section",
    "employees.currentRole": "Current logged-in role",
    "employees.roleFromAccount": "Role is assigned by your login account.",
    "employees.managerTitle": "Manager",
    "employees.managerDesc": "Can do everything: create, edit, delete, payment, billing, and release.",
    "employees.employeeTitle": "Employee",
    "employees.employeeDesc": "Can manage transactions except accounting and billing operations.",
    "employees.accountantTitle": "Accountant",
    "employees.accountantDesc": "Manages accounting and billing operations (payment and release).",
    "employees.goTracker": "Go to Transaction Tracker",
    "employees.back": "Back",
    "employees.managerOnly": "Only the manager can add, edit, or delete employees.",
    "employees.name": "Name",
    "employees.email": "Email",
    "employees.password": "Password",
    "employees.passwordHintEdit": "Leave blank to keep the current password.",
    "employees.role": "Role",
    "employees.loadError": "Unable to load employees.",
    "employees.saveError": "Unable to save employee.",
    "employees.deleteError": "Unable to delete employee.",
    "employees.deleteConfirm": "Delete this employee?",
    "employees.create": "Add employee",
    "employees.update": "Update employee",
    "employees.edit": "Edit",
    "employees.delete": "Delete",
    "employees.cancelEdit": "Cancel",
    "employees.empty": "No employees found.",
    "employees.actions": "Actions",
    "employees.emailTaken": "This email is already in use.",
    "employees.lastManagerRole": "Cannot change the role of the only manager.",
    "employees.lastManagerDelete": "Cannot delete the only manager.",
    "employees.deleteSelfError": "You cannot delete your own account.",
    "form.back": "Back to list",
    "form.newTitle": "New Transaction",
    "form.editTitle": "Edit Transaction",
    "form.accessLimitedTitle": "Access Limited",
    "form.accessLimitedBody":
      "Accountant role is limited to accounting and billing operations in transaction details.",
    "form.loadError": "Unable to load transaction",
    "form.saveError": "Could not save transaction",
    "form.clientName": "Client Name",
    "form.shippingCompanyName": "Shipping Company Name",
    "form.shippingCompanyId": "Shipping Company ID",
    "form.airwayBill": "Airway Bill",
    "form.hsCode": "HS Code",
    "form.origin": "Origin Country",
    "form.invoiceValue": "Invoice Value",
    "form.documentStatus": "Document Status",
    "form.paymentStatus": "Payment Status",
    "form.goodsDescription": "Goods Description",
    "form.save": "Save Transaction",
    "form.saving": "Saving…",
    "form.invoiceToWeightRate": "Invoice → weight rate (AED per kg)",
    "form.invoiceToWeightRateHint": "Invoice value ÷ this rate = weight",
    "form.goodsWeightKg": "Goods weight (kg)",
    "form.derivedWeight": "Calculated",
    "form.containerCount": "Number of containers",
    "form.containerArrivalDate": "Container arrival date",
    "form.documentArrivalDate": "Document arrival date",
    "form.documentPostalNumber": "Document postal number",
    "form.goodsQuantity": "Quantity of goods",
    "form.goodsQuality": "Quality of goods",
    "form.goodsUnit": "Unit of measurement",
    "form.optionalSelect": "— Select —",
    "form.quality.new": "New",
    "form.quality.like_new": "Like new",
    "form.quality.used": "Used",
    "form.quality.refurbished": "Refurbished",
    "form.quality.damaged": "Damaged",
    "form.quality.mixed": "Mixed",
    "form.unit.kg": "Kilogram (kg)",
    "form.unit.ton": "Ton",
    "form.unit.piece": "Piece",
    "form.unit.carton": "Carton",
    "form.unit.pallet": "Pallet",
    "form.unit.cbm": "CBM (m³)",
    "form.unit.liter": "Liter",
    "form.unit.set": "Set",
    "form.documentPhotosHelp": "Attach photos or PDFs of documents (optional).",
    "form.documentPhotosSection": "Document attachments",
    "form.removeAttachment": "Remove",
    "form.filesSelected": "new file(s) to upload",
    "details.title": "Transaction Details",
    "details.back": "Back to list",
    "details.edit": "Edit",
    "details.delete": "Delete",
    "details.deleting": "Deleting…",
    "details.markPaid": "Mark Paid",
    "details.release": "Release",
    "details.loadError": "Unable to load transaction details.",
    "details.deleteError": "Unable to delete transaction.",
    "details.deleteConfirm": "Delete this transaction?",
    "details.actionError": "Operation failed. Check role permissions or prerequisites.",
    "details.loading": "Loading…",
    "details.client": "Client",
    "details.shippingCompany": "Shipping Company",
    "details.createdAt": "Created At",
    "details.declaration": "Declaration",
    "details.airwayBill": "Airway Bill",
    "details.hsCode": "HS Code",
    "details.goods": "Goods",
    "details.origin": "Origin",
    "details.invoiceValue": "Invoice Value",
    "details.currencySuffix": "AED",
    "details.duty": "Duty",
    "details.risk": "Risk",
    "details.channel": "Channel",
    "details.document": "Document",
    "details.status": "Status",
    "details.payment": "Payment",
    "details.releaseCode": "Release Code",
    "details.notIssued": "Not issued",
    "details.containerCount": "Containers",
    "details.goodsWeightKg": "Goods weight (kg)",
    "details.invoiceToWeightRate": "Invoice→weight rate (AED/kg)",
    "details.containerArrivalDate": "Container arrival",
    "details.documentArrivalDate": "Document arrival",
    "details.documentPostalNumber": "Postal number",
    "details.goodsQuantity": "Quantity",
    "details.goodsQuality": "Quality",
    "details.goodsUnit": "Unit",
    "details.documentPhotos": "Document attachments",
    "details.openAttachment": "Open",
    "role.manager": "manager",
    "role.employee": "employee",
    "role.accountant": "accountant",
    "clients.title": "Clients Section",
    "clients.back": "Back",
    "clients.managerOnly": "Only manager can edit and manage clients.",
    "clients.loadError": "Unable to load clients.",
    "clients.saveError": "Unable to save client.",
    "clients.deleteError": "Unable to delete client.",
    "clients.deleteConfirm": "Delete this client?",
    "clients.companyName": "Company Name",
    "clients.trn": "Contact phone number",
    "clients.immigrationCode": "Client ID",
    "clients.clientEmail": "Client email",
    "clients.country": "Country",
    "clients.creditLimit": "Credit Limit",
    "clients.status": "Status",
    "clients.actions": "Actions",
    "clients.create": "Create Client",
    "clients.update": "Update Client",
    "clients.edit": "Edit",
    "clients.delete": "Delete",
    "clients.empty": "No clients found.",
    "clients.active": "active",
    "clients.suspended": "suspended",
    "shipping.title": "Shipping Companies Section",
    "shipping.back": "Back",
    "shipping.managerOnly": "Only manager can edit and manage shipping companies.",
    "shipping.loadError": "Unable to load shipping companies.",
    "shipping.saveError": "Unable to save shipping company.",
    "shipping.deleteError": "Unable to delete shipping company.",
    "shipping.deleteConfirm": "Delete this shipping company?",
    "shipping.companyName": "Company Name",
    "shipping.code": "Code",
    "shipping.contactName": "Contact Name",
    "shipping.phone": "Phone",
    "shipping.email": "Email",
    "shipping.location": "Location",
    "shipping.mapClickHint": "Click the map to set the office location.",
    "shipping.clearLocation": "Clear location",
    "shipping.viewOnMap": "View on map",
    "shipping.status": "Status",
    "shipping.actions": "Actions",
    "shipping.create": "Create Shipping Company",
    "shipping.update": "Update Shipping Company",
    "shipping.edit": "Edit",
    "shipping.delete": "Delete",
    "shipping.empty": "No shipping companies found.",
    "shipping.active": "active",
    "shipping.inactive": "inactive",
  },
};

export function getMessages(locale: Locale): Record<MessageKey, string> {
  return messages[locale];
}
