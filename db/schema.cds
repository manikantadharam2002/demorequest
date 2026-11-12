namespace demorequest;

entity Cities {
    key Zzcity : String(40);
}

entity BusinessSegments {
    key Zzcity : String(40);
    key BusSeg : String(40);

    city : Association to Cities
        on city.Zzcity = Zzcity;
}

entity Companies {
    key Zzcity : String(40);
    key BusSeg : String(40);
    key Bukrs  : String(4);

    businessSegment : Association to BusinessSegments
        on  businessSegment.Zzcity = Zzcity
        and businessSegment.BusSeg = BusSeg;
}

entity Projects {
    key Zzcity : String(40);
    key BusSeg : String(40);
    key Bukrs  : String(4);
    key Gsber  : String(4);

    Project     : String(100);
    ProjectName : String(200);

    company : Association to Companies
        on  company.Zzcity = Zzcity
        and company.BusSeg = BusSeg
        and company.Bukrs = Bukrs;
}

entity Vendors {
    key Lifnr : String(20);
    key Bukrs : String(4);
    key Gsber : String(4);

    Name1 : String(100);
    Ktokk : String(10);
    DateAson : Date;

    Zzcity : String(40);
    BusSeg : String(40);
    Project : String(100);
    ProjectName : String(200);

    // Request UI fields

    TotalAmt : Decimal(15,3);

    Invno : String(100);

    ApprovalAmt : Decimal(15,3);

    InvPaySelected : Boolean;

    DebitBal : Decimal(15,3);

    InvoiceAmt : Decimal(15,3);

    AdvanceAmt : Decimal(15,3);

    AdhocAmt : Decimal(15,3);

    Hbkid : String(20);

    Hktid : String(20);

    ZrpCode : String(20);

    ZrpDescription : String(100);

    Zlsch : String(10);

    RetentionAmt : Decimal(15,3);

    Msme : String(20);

    Sgtxt : String(255);
}

entity Requests {
    key ID : UUID;

    RequestNo : String(30);
    Status    : String(30);

    createdAt : Timestamp @cds.on.insert: $now;
}

entity RequestItems {
    key ID : UUID;

    Request : Association to Requests;

    Lifnr       : String(20);
    Gsber       : String(4);
    Category    : String(10);
    Docnr       : String(20);
    Bukrs       : String(4);
    Gjahr       : String(4);
    Budat       : Date;
    DocAmt      : Decimal(15,3);
    PayMethod   : String(10);
    ApprovalAmt : Decimal(15,3);

    Project     : String(100);
    ProjectName : String(200);

    Zzcity      : String(40);
    BusSeg      : String(40);
}