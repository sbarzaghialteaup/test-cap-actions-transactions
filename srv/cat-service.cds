using {my.bookshop as my} from '../db/data-model';

type Person : {
    name : String
};

@requires : 'authenticated-user'
service CatalogService {
    entity Persons as projection on my.Persons;
    action createPersonOk(person : Person) returns String;
    action createPersonCrash(person : Person) returns String;
    action createPersonsManyTransactions(persons : many Person) returns many String;
    action createPersonsCustomTransactions(persons : many Person) returns many String;
}
