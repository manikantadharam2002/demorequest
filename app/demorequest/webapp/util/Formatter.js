sap.ui.define([], function () {
    "use strict";

    return {

        formatAmount: function (vValue) {
            var nValue = parseFloat(vValue);

            if (isNaN(nValue)) {
                return "0.00";
            }

            return nValue.toFixed(2);
        },

        formatDigits: function (vValue) {
            var nValue = parseFloat(vValue);

            if (isNaN(nValue)) {
                return "0.00";
            }

            return nValue.toFixed(2);
        },

        formatRowType: function (vDocAmt) {
            var nAmount = parseFloat(vDocAmt);

            if (isNaN(nAmount)) {
                return "Inactive";
            }

            return nAmount === 0 ? "Inactive" : "Active";
        },

        formatCategory: function (vCategory) {
            if (!vCategory) {
                return "";
            }

            return vCategory;
        },

        formatLinkEnabled: function (vDocAmt) {
            var nAmount = parseFloat(vDocAmt);

            return !isNaN(nAmount) && nAmount !== 0;
        },

        formatDate: function (vDate) {
            if (!vDate) {
                return "";
            }

            var oDate = new Date(vDate);

            if (isNaN(oDate.getTime())) {
                return vDate;
            }

            var sDay = String(oDate.getDate()).padStart(2, "0");
            var sMonth = String(oDate.getMonth() + 1).padStart(2, "0");
            var sYear = oDate.getFullYear();

            return sDay + "/" + sMonth + "/" + sYear;
        },

        formatEditable: function (sPayType, sDocAmt, sApprovalAmt) {
            var nDocAmt = parseFloat(sDocAmt);
            var nApprovalAmt = parseFloat(sApprovalAmt);

            if (sPayType !== "Partial") {
                return false;
            }

            if (isNaN(nDocAmt)) {
                return false;
            }

            if (isNaN(nApprovalAmt)) {
                return true;
            }

            return true;
        },

        formatCheckboxEditable: function (sPayType, sDocAmt) {
            var nDocAmt = parseFloat(sDocAmt);

            if (isNaN(nDocAmt)) {
                return false;
            }

            return true;
        }

    };
});