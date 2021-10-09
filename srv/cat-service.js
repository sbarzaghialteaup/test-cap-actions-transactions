const cds = require("@sap/cds");

function logPerson(label, person) {
    console.log(label + JSON.stringify(person));
}

class CatalogService extends cds.ApplicationService {
    async init() {
        this.on("createPersonOk", this.createPersonOk);
        this.on("createPersonCrash", this.createPersonCrash);
        this.on("createPersonsManyTransactions", this.createPersonsManyTransactions);
        this.on("createPersonsCustomTransactions", this.createPersonsCustomTransactions);

        await super.init();
    }

    async createPersonOk(req) {
        const tx = cds.tx(req);
        await tx.run(INSERT.into(cds.entities.Persons).entries(req.data.person));
        req.reply(req.data);
    }

    async createPersonCrash(req) {
        const tx = cds.tx(req);
        //await is important, without await insert exceptions crash CAP
        tx.run(INSERT.into(cds.entities.Persons).entries(req.data.person));
        req.reply(req.data);
    }

    async createPersonsManyTransactions(req) {
        const interval = setInterval(() => {
            console.log("...faccio altro");
        }, 1);

        const tx = cds.tx(req);
        const results = [];
        req.data.persons.forEach(async (person) => {
            console.log(person);
            const result = {
                person: person,
            };
            await tx.begin();
            try {
                console.log("before before insert");
                await tx.run(INSERT.into(cds.entities.Persons).entries(person));
                console.log("before after insert");
                console.log("before commit");
                await tx.commit();
                console.log("after commit");
                result.status = "done";
            } catch (error) {
                console.log("before rollback");
                await tx.rollback();
                console.log("after rollback");
                result.status = "error: " + error.message;
            }
            results.push(result);
        });
        // CAP do commit so it need an open transaction
        console.log("before last begin");
        await tx.begin();
        console.log("after last begin");

        clearInterval(interval);
        req.reply(results);
    }

    async createPersonsCustomTransactions(req) {
        const interval = setInterval(() => {
            console.log("...faccio altro");
        }, 1);

        console.log("Start custom transaction");
        const results = await Promise.all(
            req.data.persons.map((person) => {
                logPerson("Calling createPerson: ", person);
                return this.createPerson(person);
            })
        );
        console.log("Returning results");
        clearInterval(interval);
        req.reply(results);
    }

    async createPerson(person) {
        logPerson("Create: ", person);
        const customTx = cds.tx({ user: "me" });
        try {
            logPerson("before insert: ", person);
            await customTx.run(INSERT.into(cds.entities.Persons).entries(person));
            logPerson("after insert: ", person);
            logPerson("before commit: ", person);
            await customTx.commit();
            logPerson("after commit: ", person);
            return {
                person: person,
                status: "done",
            };
        } catch (error) {
            logPerson("before rollback: ", person);
            await customTx.rollback();
            logPerson("after rollback: ", person);
            return {
                person: person,
                status: "error: " + error.message,
            };
        }
    }
}

module.exports = CatalogService;
