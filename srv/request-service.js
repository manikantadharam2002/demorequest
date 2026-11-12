const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {

    const { INSERT, SELECT } = cds.ql;

    this.on("submitRequest", async (req) => {

        try {

            // 1. Read payload sent from UI
            const oPayload = JSON.parse(req.data.payload);

            const aItems = oPayload.items || [];

            if (!aItems.length) {
                return req.reject(
                    400,
                    "At least one request item must be selected."
                );
            }

            // 2. Start transaction
            const tx = cds.tx(req);

            // 3. Generate Request Number
            const sRequestNo = "REQ-" + Date.now();

            // 4. Create Request header
            await tx.run(
                INSERT.into("demorequest.Requests").entries({
                    RequestNo: sRequestNo,
                    Status: "Submitted"
                })
            );

            // 5. Read created Request
            const oCreatedRequest = await tx.run(
                SELECT.one
                    .from("demorequest.Requests")
                    .where({ RequestNo: sRequestNo })
            );

            if (!oCreatedRequest) {
                throw new Error(
                    "Request header could not be created."
                );
            }

            // 6. Prepare Request Items
            const aRequestItems = aItems.map((oItem) => ({
                Request_ID: oCreatedRequest.ID,
                Lifnr: oItem.Lifnr || "",
                Gsber: oItem.Gsber || "",
                Category: oItem.Category || "",
                Docnr: oItem.Docnr || "",
                Bukrs: oItem.Bukrs || "",
                Gjahr: oItem.Gjahr || "",
                Budat: oItem.Budat || null,
                DocAmt: Number(oItem.DocAmt || 0),
                PayMethod: oItem.PayMethod || "",
                ApprovalAmt: Number(oItem.ApprovalAmt || 0),
                Project: oItem.Project || "",
                ProjectName: oItem.ProjectName || "",
                Zzcity: oItem.Zzcity || "",
                BusSeg: oItem.BusSeg || ""
            }));

            // 7. Create Request Items
            await tx.run(
                INSERT.into("demorequest.RequestItems")
                    .entries(aRequestItems)
            );

            // 8. Return Request Number
            return sRequestNo;

        } catch (oError) {

            console.error(
                "Submit Request failed:",
                oError
            );

            throw oError;
        }
    });

});