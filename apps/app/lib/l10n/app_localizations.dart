import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en')
  ];

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @signingIn.
  ///
  /// In en, this message translates to:
  /// **'Signing in...'**
  String get signingIn;

  /// No description provided for @tracker.
  ///
  /// In en, this message translates to:
  /// **'Tracker'**
  String get tracker;

  /// No description provided for @transactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get transactions;

  /// No description provided for @clients.
  ///
  /// In en, this message translates to:
  /// **'Clients'**
  String get clients;

  /// No description provided for @shipping.
  ///
  /// In en, this message translates to:
  /// **'Shipping'**
  String get shipping;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search...'**
  String get search;

  /// No description provided for @allStatuses.
  ///
  /// In en, this message translates to:
  /// **'All statuses'**
  String get allStatuses;

  /// No description provided for @allChannels.
  ///
  /// In en, this message translates to:
  /// **'All channels'**
  String get allChannels;

  /// No description provided for @newLabel.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get newLabel;

  /// No description provided for @noMatch.
  ///
  /// In en, this message translates to:
  /// **'No matching transactions'**
  String get noMatch;

  /// No description provided for @details.
  ///
  /// In en, this message translates to:
  /// **'Transaction Details'**
  String get details;

  /// No description provided for @client.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get client;

  /// No description provided for @shippingCompany.
  ///
  /// In en, this message translates to:
  /// **'Shipping Company'**
  String get shippingCompany;

  /// No description provided for @declaration.
  ///
  /// In en, this message translates to:
  /// **'Declaration'**
  String get declaration;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @channel.
  ///
  /// In en, this message translates to:
  /// **'Channel'**
  String get channel;

  /// No description provided for @createdAt.
  ///
  /// In en, this message translates to:
  /// **'Created At'**
  String get createdAt;

  /// No description provided for @duty.
  ///
  /// In en, this message translates to:
  /// **'Duty'**
  String get duty;

  /// No description provided for @markPaid.
  ///
  /// In en, this message translates to:
  /// **'Mark Paid'**
  String get markPaid;

  /// No description provided for @release.
  ///
  /// In en, this message translates to:
  /// **'Release'**
  String get release;

  /// No description provided for @newTransaction.
  ///
  /// In en, this message translates to:
  /// **'New Transaction'**
  String get newTransaction;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get saving;

  /// No description provided for @addClient.
  ///
  /// In en, this message translates to:
  /// **'Add Client'**
  String get addClient;

  /// No description provided for @managerOnlyClients.
  ///
  /// In en, this message translates to:
  /// **'Manager only can edit/modify clients.'**
  String get managerOnlyClients;

  /// No description provided for @addShipping.
  ///
  /// In en, this message translates to:
  /// **'Add Shipping Company'**
  String get addShipping;

  /// No description provided for @managerOnlyShipping.
  ///
  /// In en, this message translates to:
  /// **'Manager only can edit/modify shipping companies.'**
  String get managerOnlyShipping;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @confirmDelete.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete?'**
  String get confirmDelete;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @companyName.
  ///
  /// In en, this message translates to:
  /// **'Company Name'**
  String get companyName;

  /// No description provided for @trn.
  ///
  /// In en, this message translates to:
  /// **'Contact phone number'**
  String get trn;

  /// No description provided for @immigrationCode.
  ///
  /// In en, this message translates to:
  /// **'Client ID'**
  String get immigrationCode;

  /// No description provided for @clientEmail.
  ///
  /// In en, this message translates to:
  /// **'Client email'**
  String get clientEmail;

  /// No description provided for @country.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// No description provided for @creditLimit.
  ///
  /// In en, this message translates to:
  /// **'Credit Limit'**
  String get creditLimit;

  /// No description provided for @code.
  ///
  /// In en, this message translates to:
  /// **'Code'**
  String get code;

  /// No description provided for @contactName.
  ///
  /// In en, this message translates to:
  /// **'Contact Name'**
  String get contactName;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @originCountry.
  ///
  /// In en, this message translates to:
  /// **'Origin Country'**
  String get originCountry;

  /// No description provided for @airwayBill.
  ///
  /// In en, this message translates to:
  /// **'Airway Bill'**
  String get airwayBill;

  /// No description provided for @hsCode.
  ///
  /// In en, this message translates to:
  /// **'HS Code'**
  String get hsCode;

  /// No description provided for @goodsDescription.
  ///
  /// In en, this message translates to:
  /// **'Goods Description'**
  String get goodsDescription;

  /// No description provided for @invoiceValue.
  ///
  /// In en, this message translates to:
  /// **'Invoice Value'**
  String get invoiceValue;

  /// No description provided for @shippingCompanyIdOptional.
  ///
  /// In en, this message translates to:
  /// **'Shipping Company ID (optional)'**
  String get shippingCompanyIdOptional;

  /// No description provided for @shippingEmailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email (optional)'**
  String get shippingEmailOptional;

  /// No description provided for @latitudeOptional.
  ///
  /// In en, this message translates to:
  /// **'Latitude (optional)'**
  String get latitudeOptional;

  /// No description provided for @longitudeOptional.
  ///
  /// In en, this message translates to:
  /// **'Longitude (optional)'**
  String get longitudeOptional;

  /// No description provided for @txRateAedPerKg.
  ///
  /// In en, this message translates to:
  /// **'Invoice→weight rate AED/kg (optional)'**
  String get txRateAedPerKg;

  /// No description provided for @txGoodsWeightKg.
  ///
  /// In en, this message translates to:
  /// **'Goods weight kg (optional)'**
  String get txGoodsWeightKg;

  /// No description provided for @txContainerCount.
  ///
  /// In en, this message translates to:
  /// **'Number of containers (optional)'**
  String get txContainerCount;

  /// No description provided for @txContainerArrival.
  ///
  /// In en, this message translates to:
  /// **'Container arrival date'**
  String get txContainerArrival;

  /// No description provided for @txDocumentArrival.
  ///
  /// In en, this message translates to:
  /// **'Document arrival date'**
  String get txDocumentArrival;

  /// No description provided for @txDocumentPostal.
  ///
  /// In en, this message translates to:
  /// **'Document postal number'**
  String get txDocumentPostal;

  /// No description provided for @txGoodsQty.
  ///
  /// In en, this message translates to:
  /// **'Quantity of goods (optional)'**
  String get txGoodsQty;

  /// No description provided for @txGoodsQuality.
  ///
  /// In en, this message translates to:
  /// **'Quality'**
  String get txGoodsQuality;

  /// No description provided for @txGoodsUnit.
  ///
  /// In en, this message translates to:
  /// **'Unit of measurement'**
  String get txGoodsUnit;

  /// No description provided for @txAttachDocs.
  ///
  /// In en, this message translates to:
  /// **'Document photos (optional)'**
  String get txAttachDocs;

  /// No description provided for @txPickFiles.
  ///
  /// In en, this message translates to:
  /// **'Choose files'**
  String get txPickFiles;

  /// No description provided for @txQualityNew.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get txQualityNew;

  /// No description provided for @txQualityLikeNew.
  ///
  /// In en, this message translates to:
  /// **'Like new'**
  String get txQualityLikeNew;

  /// No description provided for @txQualityUsed.
  ///
  /// In en, this message translates to:
  /// **'Used'**
  String get txQualityUsed;

  /// No description provided for @txQualityRefurbished.
  ///
  /// In en, this message translates to:
  /// **'Refurbished'**
  String get txQualityRefurbished;

  /// No description provided for @txQualityDamaged.
  ///
  /// In en, this message translates to:
  /// **'Damaged'**
  String get txQualityDamaged;

  /// No description provided for @txQualityMixed.
  ///
  /// In en, this message translates to:
  /// **'Mixed'**
  String get txQualityMixed;

  /// No description provided for @txUnitKg.
  ///
  /// In en, this message translates to:
  /// **'kg'**
  String get txUnitKg;

  /// No description provided for @txUnitTon.
  ///
  /// In en, this message translates to:
  /// **'ton'**
  String get txUnitTon;

  /// No description provided for @txUnitPiece.
  ///
  /// In en, this message translates to:
  /// **'piece'**
  String get txUnitPiece;

  /// No description provided for @txUnitCarton.
  ///
  /// In en, this message translates to:
  /// **'carton'**
  String get txUnitCarton;

  /// No description provided for @txUnitPallet.
  ///
  /// In en, this message translates to:
  /// **'pallet'**
  String get txUnitPallet;

  /// No description provided for @txUnitCbm.
  ///
  /// In en, this message translates to:
  /// **'CBM'**
  String get txUnitCbm;

  /// No description provided for @txUnitLiter.
  ///
  /// In en, this message translates to:
  /// **'liter'**
  String get txUnitLiter;

  /// No description provided for @txUnitSet.
  ///
  /// In en, this message translates to:
  /// **'set'**
  String get txUnitSet;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {


  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar': return AppLocalizationsAr();
    case 'en': return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
