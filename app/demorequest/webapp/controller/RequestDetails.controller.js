sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
     "demorequest/demorequest/util/Formatter"
], (
    Controller,
     Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    MessageToast,
    Formatter
) => {
    "use strict";

    return Controller.extend(
        "demorequest.demorequest.controller.RequestDetails",
        {
            formatter: Formatter,

            formatDocAmtDisplay: function (bFrozen, sRemaining, sDocAmt) {
                return Formatter.formatAmount(
                    bFrozen ? sRemaining : sDocAmt
                );
            },

            // =========================================================
            // INITIALIZATION
            // =========================================================

            onInit() {

                const oProjectModel =
                    this.getOwnerComponent()
                        .getModel("projectModel");

                this.getView().setModel(
                    oProjectModel,
                    "projectModel"
                );
            },


            // =========================================================
            // SMART FILTER BAR
            // =========================================================

            onSmartFilterBarInitialized(oEvent) {

                const oSmartFilterBar =
                    oEvent.getSource();

                // Date As On = Today
                oSmartFilterBar.setFilterData({
                    DateAson: {
                        items: [],
                        ranges: [{
                            exclude: false,
                            operation: "LE",
                            keyField: "DateAson",
                            value1: new Date()
                        }]
                    }
                });

                // Value Help only
                [
                    "Bukrs",
                    "Lifnr",
                    "Gsber",
                    "Ktokk"
                ].forEach((sKey) => {

                    const oControl =
                        oSmartFilterBar.getControlByKey(sKey);

                    if (oControl) {
                        oControl.setValueHelpOnly(true);
                    }
                });
            },


            // =========================================================
            // FILTER SEARCH
            // =========================================================

            onFilterSearch(oEvent) {

    const oODataModel =
        this.getView().getModel();

    const oProjectModel =
        this.getView().getModel("projectModel");

    if (!oODataModel) {
        console.error("OData model not found");
        return;
    }

    if (!oProjectModel) {
        console.error("projectModel not found");
        return;
    }

    const oSmartFilterBar =
        oEvent.getSource();

    /*
     * Get the actual filter values from SmartFilterBar.
     */
    const oFilterData =
        oSmartFilterBar.getFilterData();

    console.log(
        "SmartFilterBar filter data:",
        oFilterData
    );

    /*
     * SmartFilterBar can fire search during initialization.
     * In that case getFilterData() can return null.
     *
     * Do not continue until filter data is available.
     */
    if (!oFilterData) {

        console.log(
            "SmartFilterBar is not initialized yet. Skipping search."
        );

        return;
    }

    /*
     * Check only the business filters.
     * DateAson is mandatory, so we deliberately
     * don't count it here.
     */
    const bHasBusinessFilter =
        !!(
            oFilterData.Bukrs ||
            oFilterData.Lifnr ||
            oFilterData.Gsber ||
            oFilterData.Ktokk
        );

    console.log(
        "Has business filter:",
        bHasBusinessFilter
    );

    // Clear previous hierarchy
    this._clearMasterLists();

    this.getView().setBusy(true);

    /*
     * CASE 1
     *
     * User did NOT enter:
     * Company Code
     * Vendor
     * Business Area
     * Account Group
     *
     * Date As On may still be present.
     *
     * Therefore show ALL Cities.
     */
    if (!bHasBusinessFilter) {

        console.log(
            "No business filter -> Loading ALL Cities"
        );

        oODataModel.read(
            "/Cities",
            {

                success: (oData) => {

                    const aCities =
                        oData.results || [];

                    console.log(
                        "All Cities:",
                        aCities
                    );

                    oProjectModel.setProperty(
                        "/Create/Vendor/CityProjectList",
                        aCities
                    );

                    this._showVendorCityMaster();

                    this.getView().setBusy(false);
                },

                error: (oError) => {

                    this.getView().setBusy(false);

                    console.error(
                        "Failed to load Cities:",
                        oError
                    );

                    MessageToast.show(
                        "Failed to load Cities"
                    );
                }
            }
        );

        return;
    }

    /*
     * CASE 2
     *
     * At least one business filter exists.
     *
     * Now get the OData filters generated
     * by SmartFilterBar and apply them to Vendors.
     */
    const aFilters =
        oSmartFilterBar.getFilters() || [];

    console.log(
        "Filters sent to Vendors:",
        aFilters
    );

    console.log(
        "Business filter selected -> Loading filtered Vendors"
    );

    oODataModel.read(
        "/Vendors",
        {

            filters: aFilters,

            success: (oData) => {

                const aVendors =
                    oData.results || [];

                console.log(
                    "Filtered Vendors:",
                    aVendors
                );

                /*
                 * Create unique City list
                 * from filtered Vendors.
                 */
                const oCityMap = {};

                aVendors.forEach((oVendor) => {

                    const sCity =
                        oVendor.Zzcity;

                    if (!sCity) {
                        return;
                    }

                    if (!oCityMap[sCity]) {

                        oCityMap[sCity] = {
                            Zzcity: sCity
                        };
                    }
                });

                const aCities =
                    Object.values(oCityMap);

                console.log(
                    "Filtered Cities:",
                    aCities
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/CityProjectList",
                    aCities
                );

                this._showVendorCityMaster();

                this.getView().setBusy(false);
            },

            error: (oError) => {

                this.getView().setBusy(false);

                console.error(
                    "Failed to load filtered Vendors:",
                    oError
                );

                MessageToast.show(
                    "Failed to load filtered Vendor data"
                );
            }
        }
    );
},
_showVendorCityMaster() {

    // Hide initial message
    const oMessage =
        this.byId("vendorFilterMessage");

    if (oMessage) {
        oMessage.setVisible(false);
    }

    // Show hierarchy
    const oSplitContainer =
        this.byId("vendorSplitContainer");

    if (oSplitContainer) {

        oSplitContainer.setVisible(true);

        const oCityPage =
            this.byId("masterCity");

        if (oCityPage) {

            oSplitContainer.toMaster(
                oCityPage.getId(),
                true
            );
        }
    }
},


            // =========================================================
            // CITY
            // City → Business Segment
            // =========================================================

            onCitySelect(oEvent) {

                const oItem =
                    oEvent.getSource();

                if (!oItem) {
                    console.error(
                        "No city list item received"
                    );
                    return;
                }

                const oContext =
                    oItem.getBindingContext(
                        "projectModel"
                    );

                if (!oContext) {
                    console.error(
                        "No projectModel binding context found"
                    );
                    return;
                }

                const oCity =
                    oContext.getObject();

                const sCity =
                    oCity.Zzcity;

                if (!sCity) {
                    console.error(
                        "Selected city does not contain Zzcity"
                    );
                    return;
                }

                const oODataModel =
                    this.getView().getModel();

                const oProjectModel =
                    this.getView().getModel(
                        "projectModel"
                    );

                if (!oODataModel || !oProjectModel) {
                    console.error(
                        "Required model not found"
                    );
                    return;
                }

                // Store selected City
                oProjectModel.setProperty(
                    "/Create/Vendor/City",
                    sCity
                );

                // Clear previous Business Segments
                oProjectModel.setProperty(
                    "/Create/Vendor/BusinessSegmentList",
                    []
                );

                const oCityFilter =
                    new Filter(
                        "Zzcity",
                        FilterOperator.EQ,
                        sCity
                    );

                this.getView().setBusy(true);

                oODataModel.read(
                    "/BusinessSegments",
                    {
                        filters: [
                            oCityFilter
                        ],

                        success: (oData) => {

                            const aBusinessSegments =
                                oData.results || [];

                            oProjectModel.setProperty(
                                "/Create/Vendor/BusinessSegmentList",
                                aBusinessSegments
                            );

                            this.getView().setBusy(false);

                            const oSplitContainer =
                                this.byId(
                                    "vendorSplitContainer"
                                );

                            const oNextMasterPage =
                                this.byId(
                                    "masterBusinessSegment"
                                );

                            if (
                                !oSplitContainer ||
                                !oNextMasterPage
                            ) {
                                console.error(
                                    "Business Segment navigation controls not found"
                                );
                                return;
                            }

                            oSplitContainer.toMaster(
                                oNextMasterPage.getId(),
                                true
                            );
                        },

                        error: (oError) => {

                            this.getView().setBusy(false);

                            console.error(
                                "Failed to load Business Segments:",
                                oError
                            );

                            MessageToast.show(
                                "Error while fetching Business Segments"
                            );
                        }
                    }
                );
            },


            // =========================================================
            // BUSINESS SEGMENT
            // Business Segment → Company
            // =========================================================

            onBusSegSelect(oEvent) {

                const oItem =
                    oEvent.getParameter(
                        "listItem"
                    );

                if (!oItem) {
                    console.error(
                        "No Business Segment list item received"
                    );
                    return;
                }

                const oContext =
                    oItem.getBindingContext(
                        "projectModel"
                    );

                if (!oContext) {
                    console.error(
                        "No projectModel binding context found"
                    );
                    return;
                }

                const oBusinessSegment =
                    oContext.getObject();

                const sCity =
                    oBusinessSegment.Zzcity;

                const sBusSeg =
                    oBusinessSegment.BusSeg;

                if (!sCity || !sBusSeg) {
                    console.error(
                        "Business Segment does not contain Zzcity or BusSeg"
                    );
                    return;
                }

                const oODataModel =
                    this.getView().getModel();

                const oProjectModel =
                    this.getView().getModel(
                        "projectModel"
                    );

                if (!oODataModel || !oProjectModel) {
                    console.error(
                        "Required model not found"
                    );
                    return;
                }

                // Store selected values
                oProjectModel.setProperty(
                    "/Create/Vendor/City",
                    sCity
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/BusSeg",
                    sBusSeg
                );

                // Clear Company list
                oProjectModel.setProperty(
                    "/Create/Vendor/CompanyList",
                    []
                );

                const aFilters = [
                    new Filter(
                        "Zzcity",
                        FilterOperator.EQ,
                        sCity
                    ),

                    new Filter(
                        "BusSeg",
                        FilterOperator.EQ,
                        sBusSeg
                    )
                ];

                this.getView().setBusy(true);

                oODataModel.read(
                    "/Companies",
                    {
                        filters: aFilters,

                        success: (oData) => {

                            const aCompanies =
                                oData.results || [];

                            oProjectModel.setProperty(
                                "/Create/Vendor/CompanyList",
                                aCompanies
                            );

                            this.getView().setBusy(false);

                            const oSplitContainer =
                                this.byId(
                                    "vendorSplitContainer"
                                );

                            const oNextMasterPage =
                                this.byId(
                                    "masterCompany"
                                );

                            if (
                                !oSplitContainer ||
                                !oNextMasterPage
                            ) {
                                console.error(
                                    "Company navigation controls not found"
                                );
                                return;
                            }

                            oSplitContainer.toMaster(
                                oNextMasterPage.getId(),
                                true
                            );
                        },

                        error: (oError) => {

                            this.getView().setBusy(false);

                            console.error(
                                "Failed to load Companies:",
                                oError
                            );

                            MessageToast.show(
                                "Error while fetching Companies"
                            );
                        }
                    }
                );
            },


            // =========================================================
            // COMPANY
            // Company → Project
            // =========================================================

            onBusCompSelect(oEvent) {

                const oItem =
                    oEvent.getParameter(
                        "listItem"
                    );

                if (!oItem) {
                    console.error(
                        "No Company list item received"
                    );
                    return;
                }

                const oContext =
                    oItem.getBindingContext(
                        "projectModel"
                    );

                if (!oContext) {
                    console.error(
                        "No projectModel binding context found"
                    );
                    return;
                }

                const oCompany =
                    oContext.getObject();

                const sBukrs =
                    oCompany.Bukrs;

                if (!sBukrs) {
                    console.error(
                        "Selected Company does not contain Bukrs"
                    );
                    return;
                }

                const oProjectModel =
                    this.getView().getModel(
                        "projectModel"
                    );

                const oODataModel =
                    this.getView().getModel();

                if (!oProjectModel || !oODataModel) {
                    console.error(
                        "Required model not found"
                    );
                    return;
                }

                const sCity =
                    oCompany.Zzcity ||
                    oProjectModel.getProperty(
                        "/Create/Vendor/City"
                    );

                const sBusSeg =
                    oCompany.BusSeg ||
                    oProjectModel.getProperty(
                        "/Create/Vendor/BusSeg"
                    );

                const sGsber =
                    oCompany.Gsber;

                // Store selected Company
                oProjectModel.setProperty(
                    "/Create/Vendor/Bukrs",
                    sBukrs
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/Gsber",
                    sGsber || ""
                );

                // Clear Project list
                oProjectModel.setProperty(
                    "/Create/Vendor/ProjectList",
                    []
                );

                const aFilters = [];

                if (sCity) {
                    aFilters.push(
                        new Filter(
                            "Zzcity",
                            FilterOperator.EQ,
                            sCity
                        )
                    );
                }

                if (sBusSeg) {
                    aFilters.push(
                        new Filter(
                            "BusSeg",
                            FilterOperator.EQ,
                            sBusSeg
                        )
                    );
                }

                aFilters.push(
                    new Filter(
                        "Bukrs",
                        FilterOperator.EQ,
                        sBukrs
                    )
                );

                this.getView().setBusy(true);

                oODataModel.read(
                    "/Projects",
                    {
                        filters: aFilters,

                        success: (oData) => {

                            const aProjects =
                                oData.results || [];

                            oProjectModel.setProperty(
                                "/Create/Vendor/ProjectList",
                                aProjects
                            );

                            this.getView().setBusy(false);

                            const oSplitContainer =
                                this.byId(
                                    "vendorSplitContainer"
                                );

                            const oNextMasterPage =
                                this.byId(
                                    "masterProject"
                                );

                            if (
                                !oSplitContainer ||
                                !oNextMasterPage
                            ) {
                                console.error(
                                    "Project navigation controls not found"
                                );
                                return;
                            }

                            oSplitContainer.toMaster(
                                oNextMasterPage.getId(),
                                true
                            );
                        },

                        error: (oError) => {

                            this.getView().setBusy(false);

                            console.error(
                                "Failed to load Projects:",
                                oError
                            );

                            MessageToast.show(
                                "Error while fetching Projects"
                            );
                        }
                    }
                );
            },


            // =========================================================
            // PROJECT
            // Project → Detail
            // =========================================================

            onProjectPress(oEvent) {

                const oItem =
                    oEvent.getParameter(
                        "listItem"
                    );

                if (!oItem) {
                    console.error(
                        "No Project list item received"
                    );
                    return;
                }

                const oContext =
                    oItem.getBindingContext(
                        "projectModel"
                    );

                if (!oContext) {
                    console.error(
                        "No projectModel binding context found"
                    );
                    return;
                }

                const oProject =
                    oContext.getObject();

                const sCity =
                    oProject.Zzcity;

                const sBusSeg =
                    oProject.BusSeg;

                const sBukrs =
                    oProject.Bukrs;

                const sGsber =
                    oProject.Gsber;

                const sProject =
                    oProject.Project;

                const sProjectName =
                    oProject.ProjectName;

                const oProjectModel =
                    this.getView().getModel(
                        "projectModel"
                    );

                const oODataModel =
                    this.getView().getModel();

                if (!oProjectModel || !oODataModel) {
                    console.error(
                        "Required model not found"
                    );
                    return;
                }

                // Store selected Project
                oProjectModel.setProperty(
                    "/Create/Vendor/City",
                    sCity || ""
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/BusSeg",
                    sBusSeg || ""
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/Bukrs",
                    sBukrs || ""
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/Gsber",
                    sGsber || ""
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/Project",
                    sProject || ""
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/ProjectName",
                    sProjectName || ""
                );

                // Get ordersModel
                let oOrdersModel =
                    this.getView().getModel(
                        "ordersModel"
                    );

                if (!oOrdersModel) {

                    oOrdersModel =
                        new JSONModel({
                            vendors: []
                        });

                    this.getView().setModel(
                        oOrdersModel,
                        "ordersModel"
                    );

                } else {

                    oOrdersModel.setProperty(
                        "/vendors",
                        []
                    );
                }

                // Vendor filters
                const aFilters = [];

                if (sCity) {
                    aFilters.push(
                        new Filter(
                            "Zzcity",
                            FilterOperator.EQ,
                            sCity
                        )
                    );
                }

                if (sBusSeg) {
                    aFilters.push(
                        new Filter(
                            "BusSeg",
                            FilterOperator.EQ,
                            sBusSeg
                        )
                    );
                }

                if (sBukrs) {
                    aFilters.push(
                        new Filter(
                            "Bukrs",
                            FilterOperator.EQ,
                            sBukrs
                        )
                    );
                }

                if (sGsber) {
                    aFilters.push(
                        new Filter(
                            "Gsber",
                            FilterOperator.EQ,
                            sGsber
                        )
                    );
                }

                this.getView().setBusy(true);

                oODataModel.read(
                    "/Vendors",
                    {
                        filters: aFilters,

                        success: (oData) => {

                            const aVendors =
                                oData.results || [];

                            oOrdersModel.setProperty(
                                "/vendors",
                                aVendors
                            );

                            this.getView().setBusy(false);

                            // Project → Detail
                            const oSplitContainer =
                                this.byId(
                                    "vendorSplitContainer"
                                );

                            const oDetailPage =
                                this.byId(
                                    "detailPage"
                                );

                            if (
                                !oSplitContainer ||
                                !oDetailPage
                            ) {
                                console.error(
                                    "Detail navigation controls not found"
                                );
                                return;
                            }

                            oSplitContainer.toDetail(
                                oDetailPage.getId()
                            );
                        },

                        error: (oError) => {

                            this.getView().setBusy(false);

                            console.error(
                                "Failed to load Vendors:",
                                oError
                            );

                            MessageToast.show(
                                "Error while fetching Vendors"
                            );
                        }
                    }
                );
            },


            // =========================================================
            // BACK NAVIGATION
            // =========================================================

            onBusSegBack() {

                const oSplitContainer =
                    this.byId(
                        "vendorSplitContainer"
                    );

                if (oSplitContainer) {
                    oSplitContainer.backMaster();
                }
            },


            onCompanyBack() {

                const oSplitContainer =
                    this.byId(
                        "vendorSplitContainer"
                    );

                if (oSplitContainer) {
                    oSplitContainer.backMaster();
                }
            },


            onProjectBack() {

                const oSplitContainer =
                    this.byId(
                        "vendorSplitContainer"
                    );

                if (oSplitContainer) {
                    oSplitContainer.backMaster();
                }
            },


            // =========================================================
            // VENDOR TABLE
            // =========================================================

            onSelection(oEvent) {

                const oTable = oEvent.getSource();

                if (!oTable) {
                    return;
                }

                const aSelectedIndices =
                    oTable.getSelectedIndices();

                const oOrdersModel =
                    this.getView().getModel("ordersModel");

                if (!oOrdersModel) {
                    console.error("ordersModel not found");
                    return;
                }

                const aSelectedVendors = [];

                aSelectedIndices.forEach((iIndex) => {

                    const oContext =
                        oTable.getContextByIndex(iIndex);

                    if (!oContext) {
                        return;
                    }

                    const oVendor =
                        oContext.getObject();

                    if (oVendor) {
                        aSelectedVendors.push(oVendor);
                    }
                });

                const oProjectModel =
                    this.getView().getModel("projectModel");

                if (oProjectModel) {

                    oProjectModel.setProperty(
                        "/SelectedVendors",
                        aSelectedVendors
                    );
                }

                console.log(
                    "Selected vendor rows:",
                    aSelectedVendors
                );
                this._calculateTotalApprovalAmount();
            },

            onRowsUpdated() {
                // Reserved for future table handling
            },


            // =========================================================
            // APPROVAL AMOUNT
            // =========================================================

           onDialogApprovalAmountChange(oEvent) {

    const oInput = oEvent.getSource();

    const oContext =
        oInput.getBindingContext("dialogModel");

    if (!oContext) {
        return;
    }

    const oInvoice =
        oContext.getObject();

    if (!oInvoice) {
        return;
    }

    const vValue =
        oInput.getValue();

    const nDocAmt =
        Number(oInvoice.DocAmt);

    const nApprovalAmt =
        Number(vValue);

    /*
     * Empty value
     */
    if (
        vValue === null ||
        vValue === undefined ||
        String(vValue).trim() === ""
    ) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount is required."
        );

        return;
    }

    /*
     * Invalid number
     */
    if (Number.isNaN(nApprovalAmt)) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Please enter a valid amount."
        );

        return;
    }

    /*
     * Negative amount
     */
    if (nApprovalAmt < 0) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount cannot be negative."
        );

        return;
    }

    /*
     * Approval Amount cannot exceed
     * Document Amount.
     */
    if (
        Number.isNaN(nDocAmt) ||
        nApprovalAmt > nDocAmt
    ) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount cannot exceed Document Amount."
        );

        return;
    }

    /*
     * Valid amount
     */
    oContext.setProperty(
        "ApprovalAmt",
        nApprovalAmt
    );

    oContext.setProperty(
        "ApprovalAmtState",
        "None"
    );

    oContext.setProperty(
        "ApprovalAmtStateText",
        ""
    );

    /*
     * Update the main screen total.
     *
     * The vendor row is updated only when
     * the value is valid.
     */
    this._calculateTotalApprovalAmount();
},
onFieldValueChange(oEvent) {

    const oInput =
        oEvent.getSource();

    const oContext =
        oInput.getBindingContext("dialogModel");

    if (!oContext) {
        return;
    }

    const oInvoice =
        oContext.getObject();

    if (!oInvoice) {
        return;
    }

    const vValue =
        oInput.getValue();

    const nDocAmt =
        Number(oInvoice.DocAmt);

    const nApprovalAmt =
        Number(vValue);

    /*
     * Empty value
     */
    if (
        vValue === null ||
        vValue === undefined ||
        String(vValue).trim() === ""
    ) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount is required."
        );

        return;
    }

    /*
     * Invalid number
     */
    if (Number.isNaN(nApprovalAmt)) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Please enter a valid amount."
        );

        return;
    }

    /*
     * Negative amount
     */
    if (nApprovalAmt < 0) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount cannot be negative."
        );

        return;
    }

    /*
     * Approval Amount cannot exceed
     * Document Amount.
     */
    if (
        Number.isNaN(nDocAmt) ||
        nApprovalAmt > nDocAmt
    ) {

        oContext.setProperty(
            "ApprovalAmtState",
            "Error"
        );

        oContext.setProperty(
            "ApprovalAmtStateText",
            "Approval Amount cannot exceed Document Amount."
        );

        return;
    }

    /*
     * Valid amount
     */
    oContext.setProperty(
        "ApprovalAmt",
        nApprovalAmt
    );

    oContext.setProperty(
        "ApprovalAmtState",
        "None"
    );

    oContext.setProperty(
        "ApprovalAmtStateText",
        ""
    );
},
            _calculateTotalApprovalAmount() {

    const oOrdersModel =
        this.getView().getModel("ordersModel");

    const oProjectModel =
        this.getView().getModel("projectModel");

    const oTable =
        this.byId("vendorsTable");

    if (!oOrdersModel || !oProjectModel || !oTable) {
        return;
    }

    const aSelectedIndices =
        oTable.getSelectedIndices();

    const aVendors =
        oOrdersModel.getProperty("/vendors") || [];

    let nTotal = 0;

    aSelectedIndices.forEach((iIndex) => {

        const oVendor =
            aVendors[iIndex];

        if (!oVendor) {
            return;
        }

        const nAmount =
            Number(oVendor.ApprovalAmt);

        if (!Number.isNaN(nAmount)) {
            nTotal += nAmount;
        }
    });

    oProjectModel.setProperty(
        "/ApprovalAmount",
        nTotal
    );

    console.log(
        "Total Approval Amount:",
        nTotal
    );
},
            // =========================================================
            // INVOICE PAYMENT
            // =========================================================

            onInvoicePaySelect(oEvent) {

                const bSelected =
                    oEvent.getParameter(
                        "selected"
                    );

                const oContext =
                    oEvent.getSource()
                        .getBindingContext(
                            "ordersModel"
                        );

                if (!oContext) {
                    return;
                }

                console.log(
                    "Invoice Payment selected:",
                    bSelected
                );
            },
            onCloseOrderDialog() {

    if (!this._oInvoiceDetailDialog) {
        return;
    }

    const oDialogModel =
        this._oInvoiceDetailDialog.getModel("dialogModel");

    if (!oDialogModel) {
        this._oInvoiceDetailDialog.close();
        return;
    }

    const aInvoices =
        oDialogModel.getProperty("/Invoices") || [];

    let nTotalApprovalAmount = 0;
    let bValid = true;

    aInvoices.forEach((oInvoice) => {

        const nDocAmt =
            Number(oInvoice.DocAmt);

        const nApprovalAmt =
            Number(oInvoice.ApprovalAmt);

        /*
         * Validate empty / invalid amount
         */
        if (
            oInvoice.ApprovalAmt === null ||
            oInvoice.ApprovalAmt === undefined ||
            String(oInvoice.ApprovalAmt).trim() === "" ||
            Number.isNaN(nApprovalAmt)
        ) {

            bValid = false;

            oInvoice.ApprovalAmtState = "Error";
            oInvoice.ApprovalAmtStateText =
                "Please enter a valid Approval Amount.";

            return;
        }

        /*
         * Negative amount
         */
        if (nApprovalAmt < 0) {

            bValid = false;

            oInvoice.ApprovalAmtState = "Error";
            oInvoice.ApprovalAmtStateText =
                "Approval Amount cannot be negative.";

            return;
        }

        /*
         * Approval Amount cannot exceed
         * Document Amount.
         */
        if (
            Number.isNaN(nDocAmt) ||
            nApprovalAmt > nDocAmt
        ) {

            bValid = false;

            oInvoice.ApprovalAmtState = "Error";
            oInvoice.ApprovalAmtStateText =
                "Approval Amount cannot exceed Document Amount.";

            return;
        }

        /*
         * Valid invoice amount
         */
        oInvoice.ApprovalAmtState = "None";
        oInvoice.ApprovalAmtStateText = "";

        nTotalApprovalAmount += nApprovalAmt;
    });

    /*
     * Do not close the dialog if
     * any invoice has an invalid amount.
     */
    if (!bValid) {

        oDialogModel.refresh(true);

        MessageToast.show(
            "Please enter a valid Approval Amount."
        );

        return;
    }

    /*
     * Update selected vendor row.
     */
    if (this._invoiceVendorContext) {

        this._invoiceVendorContext.setProperty(
            "ApprovalAmt",
            nTotalApprovalAmount
        );
    }

    /*
     * Recalculate the main screen total
     * from selected vendor rows.
     */
    this._calculateTotalApprovalAmount();

    /*
     * Close dialog.
     */
    this._oInvoiceDetailDialog.close();
},
                onPayMethodPress(oEvent) {
                    const oButton = oEvent.getSource();

                    // Get the vendor row context from ordersModel
                    const oContext = oButton.getBindingContext("ordersModel");

                    if (!oContext) {
                        MessageToast.show("Unable to get vendor details.");
                        return;
                    }

                    // Selected vendor from CAP data
                    const oVendor = oContext.getObject();

                    if (!oVendor) {
                        MessageToast.show("Vendor details not found.");
                        return;
                    }
                     // Remember the selected vendor row
                     this._invoiceVendorContext = oContext;

                    // Create the data required by InvoiceDetail.fragment.xml
                    const oDialogData = {
                        PayType: "Full",

                        ApprovalAmount: Number(oVendor.ApprovalAmt) || 0,

                        TotalAmount: Number(oVendor.TotalAmt) || 0,

                        ApprovalAmtState: "None",
                        ApprovalAmtStateText: "",

                        Invoices: [
                            {
                                Category: "Vendor",

                                Docnr: oVendor.Lifnr || "",

                                Budat: oVendor.DateAson || "",

                                DocAmt: Number(oVendor.InvoiceAmt) || 0,

                                ApprovalAmt: Number(oVendor.ApprovalAmt) || 0,

                                Xblnr: oVendor.Invno || "",

                                Sgtxt: oVendor.Sgtxt || "",

                                IsFrozen: false,

                                RemainingAmt: Number(oVendor.InvoiceAmt) || 0,

                                PendReqNo: "",

                                ApprovalAmtState: "None",

                                ApprovalAmtStateText: ""
                            }
                        ]
                    };

                    // Create dialog JSON model
                    const oDialogModel = new JSONModel(oDialogData);

                    // Load the Invoice Details fragment
                   if (!this._oInvoiceDetailDialog) {
                        Fragment.load({
                            name: "demorequest.demorequest.fragment.InvoiceDetail",
                            controller: this
                        }).then((oDialog) => {

                            this.getView().addDependent(oDialog);

                            this._oInvoiceDetailDialog = oDialog;

                            this._oInvoiceDetailDialog.setModel(
                                oDialogModel,
                                "dialogModel"
                            );

                            this._oInvoiceDetailDialog.open();

                        }).catch((oError) => {

                            console.error(
                                "Error loading InvoiceDetail fragment:",
                                oError
                            );

                            MessageToast.show(
                                "Unable to open Invoice Details."
                            );
                        });

                    } else {

                        this._oInvoiceDetailDialog.setModel(
                            oDialogModel,
                            "dialogModel"
                        );

                        this._oInvoiceDetailDialog.open();
                    }
                },
                



            // =========================================================
            // CLEAR MASTER LISTS
                        


            // =========================================================
            // AD HOC DETAILS
            // =========================================================

            onAdHocPress(oEvent) {

                const oButton =
                    oEvent.getSource();

                // Get the vendor row context from ordersModel
                const oContext =
                    oButton.getBindingContext("ordersModel");

                if (!oContext) {
                    MessageToast.show(
                        "Unable to get vendor details."
                    );
                    return;
                }

                // Selected vendor from CAP data
                const oVendor =
                    oContext.getObject();

                if (!oVendor) {
                    MessageToast.show(
                        "Vendor details not found."
                    );
                    return;
                }

                /*
                 * Create the data required by
                 * AdHocDialog.fragment.xml
                 */
                const aAdHocData = [
                    {
                        Docnr: oVendor.Lifnr || "",
                        Budat: oVendor.DateAson || "",
                        DocAmt: Number(
                            oVendor.AdhocAmt
                        ) || 0,
                        Xblnr: oVendor.Invno || ""
                    }
                ];

                // Create Ad Hoc JSON model
                const oAdHocModel =
                    new JSONModel(aAdHocData);

                // Load Ad Hoc Details fragment
                if (!this._oAdHocDialog) {

                    Fragment.load({
                        name:
                            "demorequest.demorequest.fragment.AdHocDialog",
                        controller: this

                    }).then((oDialog) => {

                        this.getView()
                            .addDependent(oDialog);

                        this._oAdHocDialog =
                            oDialog;

                        this._oAdHocDialog.setModel(
                            oAdHocModel,
                            "adHocModel"
                        );

                        this._oAdHocDialog.open();

                    }).catch((oError) => {

                        console.error(
                            "Error loading AdHocDialog fragment:",
                            oError
                        );

                        MessageToast.show(
                            "Unable to open Ad Hoc Details."
                        );
                    });

                } else {

                    this._oAdHocDialog.setModel(
                        oAdHocModel,
                        "adHocModel"
                    );

                    this._oAdHocDialog.open();
                }
            },

            onCancelDialog() {

                if (this._oAdHocDialog) {
                    this._oAdHocDialog.close();
                }
            },


            // =========================================================
            // CLEAR MASTER LISTS

            _clearMasterLists() {

                const oProjectModel =
                    this.getView().getModel(
                        "projectModel"
                    );

                if (!oProjectModel) {
                    return;
                }

                oProjectModel.setProperty(
                    "/Create/Vendor/CityProjectList",
                    []
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/BusinessSegmentList",
                    []
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/CompanyList",
                    []
                );

                oProjectModel.setProperty(
                    "/Create/Vendor/ProjectList",
                    []
                );
            },
            onSubmitPress() {

                const oView = this.getView();

                const oODataModel = oView.getModel();
                const oProjectModel = oView.getModel("projectModel");
                const oOrdersModel = oView.getModel("ordersModel");
                const oTable = this.byId("vendorsTable");

                if (!oODataModel) {
                    MessageToast.show("OData model not found.");
                    return;
                }

                if (!oProjectModel || !oOrdersModel || !oTable) {
                    MessageToast.show("Request data is not available.");
                    return;
                }

                const aSelectedIndices = oTable.getSelectedIndices();

                if (!aSelectedIndices.length) {
                    MessageToast.show("Please select at least one vendor.");
                    return;
                }

                const aVendors =
                    oOrdersModel.getProperty("/vendors") || [];

                const aSelectedVendors = [];

                aSelectedIndices.forEach((iIndex) => {

                    const oVendor = aVendors[iIndex];

                    if (oVendor) {
                        aSelectedVendors.push(oVendor);
                    }
                });

                if (!aSelectedVendors.length) {
                    MessageToast.show("Selected vendor data not found.");
                    return;
                }

                const nTotalApprovalAmount =
                    Number(
                        oProjectModel.getProperty("/ApprovalAmount")
                    ) || 0;

                if (nTotalApprovalAmount <= 0) {
                    MessageToast.show(
                        "Approval Amount must be greater than zero."
                    );
                    return;
                }

                const sRequestNo =
                    "REQ-" +
                    new Date().getTime();

                const oRequestPayload = {
                    RequestNo: sRequestNo,
                    Status: "Submitted"
                };

                console.log(
                    "Creating Request:",
                    oRequestPayload
                );

                oView.setBusy(true);

                oODataModel.create(
                    "/Requests",
                    oRequestPayload,
                    {

                        success: (oRequestData) => {

                            console.log(
                                "Request created:",
                                oRequestData
                            );

                            const sRequestId =
                                oRequestData.ID;

                            if (!sRequestId) {

                                oView.setBusy(false);

                                MessageToast.show(
                                    "Request created but Request ID was not returned."
                                );

                                return;
                            }

                            this._createRequestItems(
                                sRequestId,
                                aSelectedVendors
                            );
                        },

                        error: (oError) => {

                            oView.setBusy(false);

                            console.error(
                                "Failed to create Request:",
                                oError
                            );

                            MessageToast.show(
                                "Failed to submit Request."
                            );
                        }
                    }
                );
            },
            _createRequestItems(sRequestId, aSelectedVendors) {

                const oView = this.getView();
                const oODataModel = oView.getModel();

                let iCompleted = 0;
                let bError = false;

                aSelectedVendors.forEach((oVendor) => {

                    const oPayload = {
                        Request_ID: sRequestId,

                        Lifnr: oVendor.Lifnr || "",
                        Gsber: oVendor.Gsber || "",

                        Category: "Vendor",

                        Docnr: oVendor.Invno || "",

                        Bukrs: oVendor.Bukrs || "",

                        Gjahr: String(
                            new Date().getFullYear()
                        ),

                        Budat: oVendor.DateAson || null,

                        DocAmt:
                            Number(oVendor.InvoiceAmt) || 0,

                        PayMethod:
                            oVendor.InvPaySelected
                                ? "Full"
                                : "Partial",

                        ApprovalAmt:
                            Number(oVendor.ApprovalAmt) || 0,

                        Project: oVendor.Project || "",

                        ProjectName:
                            oVendor.ProjectName || "",

                        Zzcity: oVendor.Zzcity || "",

                        BusSeg: oVendor.BusSeg || ""
                    };

                    console.log(
                        "Creating RequestItem:",
                        oPayload
                    );

                    oODataModel.create(
                        "/RequestItems",
                        oPayload,
                        {

                            success: (oData) => {

                                console.log(
                                    "RequestItem created:",
                                    oData
                                );

                                iCompleted++;

                                if (
                                    iCompleted ===
                                    aSelectedVendors.length
                                ) {

                                    oView.setBusy(false);

                                    if (!bError) {

                                        MessageToast.show(
                                            "Request submitted successfully."
                                        );

                                        console.log(
                                            "Request submitted successfully. Request ID:",
                                            sRequestId
                                        );
                                    }
                                }
                            },

                            error: (oError) => {

                                console.error(
                                    "Failed to create RequestItem:",
                                    oError
                                );

                                bError = true;
                                iCompleted++;

                                if (
                                    iCompleted ===
                                    aSelectedVendors.length
                                ) {

                                    oView.setBusy(false);

                                    MessageToast.show(
                                        "Request created, but one or more Request Items failed."
                                    );
                                }
                            }
                        }
                    );
                });
            },
            onSubmitPress: function () {

                var oView = this.getView();
                var oModel = oView.getModel();
                var oLocalModel = this.getView().getModel("zRequestModel");

                // 1. Get selected vendors/items
                var aSelectedItems = oLocalModel.getProperty("/SelectedVendors") || [];

                // 2. Validate selection
                if (!aSelectedItems.length) {
                    sap.m.MessageBox.error(
                        "At least one request item must be selected."
                    );
                    return;
                }

                // 3. Prepare payload
                var oPayload = {
                    items: aSelectedItems
                };

                // 4. Convert payload to JSON string
                var sPayload = JSON.stringify(oPayload);

                // 5. Call CAP action
                oModel.callFunction("/submitRequest", {
                    method: "POST",

                    urlParameters: {
                        payload: sPayload
                    },

                    
                    success: function (oData) {

                        var sRequestNo =
                            oData.submitRequest ||
                            (oData.d && oData.d.submitRequest);

                        sap.m.MessageBox.success(
                            "Request submitted successfully.\n\nRequest No: " +
                            sRequestNo,
                            {
                                onClose: function () {

                                    // Reload the Request page
                                    window.location.reload();
                                }
                            }
                        );

                        console.log(
                            "Request submitted:",
                            sRequestNo
                        );
                    },
                    error: function (oError) {

                        console.error(
                            "Submit Request failed:",
                            oError
                        );

                        sap.m.MessageBox.error(
                            "Request submission failed."
                        );
                    }
                });
            },
            onCancelPress() {

                console.log("Cancel Request pressed");

                /*
                * 1. Clear SmartFilterBar
                */
                const oSmartFilterBar =
                    this.byId("vendorFilterBar");

                if (oSmartFilterBar) {
                    oSmartFilterBar.clear();
                }

                /*
                * 2. Clear project / hierarchy data
                */
                this._clearMasterLists();

                /*
                * 3. Clear selected project/request data
                */
                const oProjectModel =
                    this.getView().getModel("projectModel");

                if (oProjectModel) {

                    oProjectModel.setProperty(
                        "/Create",
                        {
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
                        }
                    );

                    oProjectModel.setProperty(
                        "/SelectedVendors",
                        []
                    );

                    oProjectModel.setProperty(
                        "/SelectedInvoices",
                        []
                    );

                    oProjectModel.setProperty(
                        "/ApprovalAmount",
                        0
                    );
                }

                /*
                * 4. Clear Vendor Details table
                */
                const oOrdersModel =
                    this.getView().getModel("ordersModel");

                if (oOrdersModel) {

                    oOrdersModel.setProperty(
                        "/vendors",
                        []
                    );
                }

                /*
                * 5. Clear table selection
                */
                const oTable =
                    this.byId("vendorsTable");

                if (oTable) {
                    oTable.clearSelection();
                }

                /*
                * 6. Close Invoice Details dialog
                *    if it is currently open.
                */
                if (this._oInvoiceDetailDialog) {
                    this._oInvoiceDetailDialog.close();
                }

                /*
                * 7. Reset Invoice dialog reference.
                */
                this._invoiceVendorContext = null;

                /*
                * 8. Return SplitContainer to City.
                */
                const oSplitContainer =
                    this.byId("vendorSplitContainer");

                if (oSplitContainer) {

                    oSplitContainer.toMaster(
                        this.byId("masterCity")
                    );

                    oSplitContainer.toDetail(
                        this.byId("emptyDetailPage")
                    );
                }

                /*
                * 9. Hide Vendor hierarchy again.
                */
                if (oSplitContainer) {
                    oSplitContainer.setVisible(false);
                }

                /*
                * 10. Show the initial filter message.
                */
                const oFilterMessage =
                    this.byId("vendorFilterMessage");

                if (oFilterMessage) {
                    oFilterMessage.setVisible(true);
                }

                console.log("Request cancelled and UI reset.");
            }

        }
    );
});