using demorequest from '../db/schema';

@path: '/request'
service RequestService {

    entity Cities            as projection on demorequest.Cities;
    entity BusinessSegments  as projection on demorequest.BusinessSegments;
    entity Companies          as projection on demorequest.Companies;
    entity Projects           as projection on demorequest.Projects;
    entity Vendors            as projection on demorequest.Vendors;

    entity Requests           as projection on demorequest.Requests;
    entity RequestItems       as projection on demorequest.RequestItems;

        action submitRequest(
            payload : String
        ) returns String;

}

