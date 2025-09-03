sap.ui.define(
  [
    "./BaseController",
    "sap/ui/Device",
    "../util/Formatter",
  ],
  function (
    BaseController,
    Device,
    Formatter
  ) {
    "use strict";

    /* ---------------------------------------------------------------------------------------------- */
    /*                                           global sap                                           */
    /* ---------------------------------------------------------------------------------------------- */

    return BaseController.extend("<%= namespace %>.controller.Main", {
      formatter: Formatter,
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
    });
  }
);
