sap.ui.define(
  [
    "./Base.controller",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "../service/UserService",
    "../service/SessionManager",
    "../model/formatter",
  ],
  function (
    BaseController,
    Fragment,
    Device,
    UserService,
    SessionManager,
    Formatter
  ) {
    "use strict";

    /* ---------------------------------------------------------------------------------------------- */
    /*                                           global sap                                           */
    /* ---------------------------------------------------------------------------------------------- */

    return BaseController.extend("<%= namespace %>.controller.Main", {
      formatter: Formatter,
      _popover: null, // Popover nesnesini saklamak için
      /**
       * @override
       * @brief Controller ilk yüklendiğinde çalışır.
       * Gerekli modelleri başlatır, tema ayarlarını yükler ve rota dinleyicisini bağlar.
       */
      onInit: function () {
        this.getRouter().attachRoutePatternMatched(
          this._routePatternMatched,
          this
        );

        // View'a özel modelleri oluştur
        this.setModel({ showNavButton: false }, "App");
      },

      /**
       * @brief Yan menüyü açıp kapatmak için ShellBar'daki butona basıldığında çalışır.
       */
      onSideNavButtonPress: function () {
        const oToolPage = this.byId("idToolPage");
        oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
      },

      /**
       * @brief Rota her değiştiğinde tetiklenir.
       * Geri butonunun görünürlüğünü ve yan menünün seçili elemanını ayarlar.
       * @param {sap.ui.base.Event} oEvent Rota eşleşme olayı
       * @private
       */
      _routePatternMatched: function (oEvent) {
        this._sCurrentRouteName = oEvent.getParameter("name");
        const oNavigation = this.byId("idMenuSideNavigation");

        this.getModel("App").setProperty("/showNavButton", false);

        const oRouteToMenuKeyMap = {
          Home: "Home",
          Settings: "Settings",
        };

        const sMenuKey = oRouteToMenuKeyMap[this._sCurrentRouteName];
        if (sMenuKey) {
          oNavigation.setSelectedKey(sMenuKey);
        }
      },

      /**
       * @brief Profil resmine (Avatar) tıklandığında çalışır ve Popover'ı açar.
       * @param {sap.ui.base.Event} oEvent Olay nesnesi
       */
      onAvatarPress: function (oEvent) {
        const oAvatar = oEvent.getSource();

        if (!this._popover) {
          Fragment.load({
            name: "<%= namespace %>.view.fragments.UserPopover",
            controller: this,
          }).then((oPopover) => {
            this._popover = oPopover;
            this.getView().addDependent(this._popover);
            this._popover.openBy(oAvatar);
          });
        } else {
          this._popover.openBy(oAvatar);
        }
      },

      /**
       * @brief Popover içindeki 'Çıkış Yap' butonuna basıldığında çalışır.
       */
      onLogoutFromPopover: function () {
        this._executeLogout();
      },

      /**
       * @brief Merkezi logout mantığını çalıştıran özel fonksiyon.
       * Kullanıcıya geri bildirim verdikten sonra 1 saniye bekler ve çıkış yapar.
       * @private
       */
      _executeLogout: async function () {
        this.setBusy(true, "settings", "/logBusy");

        try {
          // Bu, Promise ve setTimeout ile modern bekleme yöntemidir.
          await new Promise((resolve) => setTimeout(resolve, 900));

          await UserService.logout();

          if (this._popover) {
            this._popover.close();
          }

          window.location.href = "";
        } catch (oError) {
          this.handleServiceError(oError, this.getText("logoutError"));
        } finally {
          this.setBusy(false, "settings", "/logBusy");
        }
      },

      /**
       * @brief Geri butonuna basıldığında tetiklenir.
       * Bir önceki sayfaya döner.
       */
      navButtonPress: function () {
        // Geçerli route adını al ve ana route'u belirle
        let currentRouteName = this.getRouter().getHashChanger().getHash();
        currentRouteName = currentRouteName.split("/")[0];

        // Route ismine göre EventBus yayınını yap
        const routeEvents = {
          Settings: "navSettings"
        };

        if (routeEvents[currentRouteName]) {
          this.getEventBus().publish(routeEvents[currentRouteName]);
        }
      },

      /**
       * @brief Yan menüdeki bir eleman seçildiğinde çalışır.
       * @param {sap.ui.base.Event} oEvent Olay nesnesi
       */
      onItemSelect: function (oEvent) {
        const oItem = oEvent.getParameter("item");
        const sKey = oItem.getKey();

        if (sKey === "logout") {
          this._executeLogout();
          return;
        }

        const sCurrentRouteHash = this.getRouter().getHashChanger().getHash();
        if (sKey === sCurrentRouteHash) {
          if (Device.system.phone) {
            this.byId("idToolPage").setSideExpanded(false);
          }
          return;
        }

        if (Device.system.phone) {
          this.byId("idToolPage").setSideExpanded(false);
        }

        this.getRouter().navTo(sKey);
      },

      /**
       * @brief Kullanıcı yeni bir dil seçtiğinde tetiklenir.
       * @param {sap.ui.base.Event} oEvent
       */
      onLanguageSelect: function (oEvent) {
        const sSelectedLanguage = oEvent.getParameter("item").getKey();
        const oUriParams = new URLSearchParams(window.location.search);
        const sCurrentLanguage = sap.ui
          .getCore()
          .getConfiguration()
          .getLanguage()
          .substring(0, 2);

        if (sSelectedLanguage && sSelectedLanguage !== sCurrentLanguage) {
          localStorage.setItem("userLanguage", sSelectedLanguage);
          oUriParams.set("sap-language", sSelectedLanguage);
          window.location.search = oUriParams.toString();
        }
      },
    });
  }
);
