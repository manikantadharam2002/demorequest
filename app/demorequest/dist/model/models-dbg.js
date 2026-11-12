sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createLocalJson: function () {

            var oCreateData = this.getBlankRequestData();

            return new JSONModel({

                // Request creation data
                Create: oCreateData,

                // Reference UI state
                SelectedKey: "Vendors",

                IsCategoryVisible: true,

                // Total approval amount shown at the top
                ApprovalAmount: 0,

                // Vendor hierarchy
                Vendor: {
                    CityProjectList: [],
                    BusinessSegmentList: [],
                    CompanyList: [],
                    ProjectList: [],

                    // Vendor detail records
                    Vendors: []
                },

                // Customer kept for compatibility
                // with the reference application
                Customer: {
                    CityProjectList: [],
                    BusinessSegmentList: [],
                    CompanyList: [],
                    ProjectList: [],

                    Customers: []
                },

                // Selected vendor/invoice information
                SelectedVendors: [],

                SelectedInvoices: [],

                // Used by payment selection
                PaymentMode: "Full"
            });
        },

        getBlankRequestData: function () {

            return {

                Vendor: {

                    City: "",
                    BusSeg: "",
                    Bukrs: "",
                    Gsber: "",
                    Project: "",
                    ProjectName: "",

                    Vendors: []
                },

                Customer: {

                    City: "",
                    BusSeg: "",
                    Bukrs: "",
                    Gsber: "",
                    Project: "",
                    ProjectName: "",

                    Customers: []
                }

            };
        }

    };

});