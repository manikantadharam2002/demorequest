using RequestService from './request-service';

annotate RequestService.Vendors with {

    // Company Code
    Bukrs @Common.ValueList: {
        CollectionPath: 'Companies',
        Label: 'Company Code',
        SearchSupported: true,

        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: Bukrs,
                ValueListProperty: 'Bukrs'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Zzcity'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'BusSeg'
            }
        ]
    };

    // Vendor
    Lifnr @Common.ValueList: {
        CollectionPath: 'Vendors',
        Label: 'Vendor',
        SearchSupported: true,

        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: Lifnr,
                ValueListProperty: 'Lifnr'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Name1'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Bukrs'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Zzcity'
            }
        ]
    };

    // Business Area
    Gsber @Common.ValueList: {
        CollectionPath: 'Vendors',
        Label: 'Business Area',
        SearchSupported: true,

        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: Gsber,
                ValueListProperty: 'Gsber'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Bukrs'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Zzcity'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Project'
            }
        ]
    };

    // Account Group
    Ktokk @Common.ValueList: {
        CollectionPath: 'Vendors',
        Label: 'Account Group',
        SearchSupported: true,

        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: Ktokk,
                ValueListProperty: 'Ktokk'
            },
            {
                $Type: 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Name1'
            }
        ]
    };

};