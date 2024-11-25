let db;

function openDb() {
	const openRequest = window.indexedDB.open("restruct_db", 1);

	openRequest.addEventListener("error", () => console.error("Database failed to open"));

	openRequest.addEventListener("success", () => {
		console.log("Database opened successfully");

		db = openRequest.result;
	});

	openRequest.addEventListener("upgradeneeded", e => {
		db = e.target.result;

		// reminders table
		const objectStore = db.createObjectStore("reminders", {keyPath: "id", autoIncrement: true});

		objectStore.createIndex("name", "name");
		objectStore.createIndex("date", "date");
		objectStore.createIndex("isFullDay", "isFullDay");

		console.log("Database setup complete");
	});
}

// adds or edits multiple entries
function addEditData(objectStore, dataArray) {
	const transaction = db.transaction(objectStore, "readwrite")
	const os = transaction.objectStore(objectStore);

	dataArray.forEach(data => {
		const putReq = os.put(data);
		
		putReq.addEventListener("success", e => {
			const dataId = e.target.result;
			console.log(dataId);
		});
	});

	transaction.addEventListener("complete", () => {
		console.log("Transaction completed: database modification finished.");
	});

	transaction.addEventListener("error", () => console.log("Transaction not opened due to error"));
}

// deletes a single piece of data given id in objectStore
function deleteData(objectStore, id) {
	const transaction = db.transaction(objectStore, "readwrite");
	const os = transaction.objectStore(objectStore);

	const delReq = os.delete(id);

	transaction.addEventListener("complete", () => {

	});
}

// deletes all data in objectStore
function deleteAllData(objectStore) {
	const os = db.transaction(objectStore, 'readwrite').objectStore(objectStore);

	const clrReq = os.clear();

	clrReq.onsuccess = () => {
		console.log('db cleared');
	}
}

// gets an individual entry
function getData(objectStore, id) {
	const transaction = db.transaction(objectStore);
	const os = transaction.objectStore(objectStore);

	const getReq = os.get(id);

	getReq.onsuccess = e => {
		console.log(getReq.result);
	}

	getReq.onerror = e => {
		console.log(e);
	}
}

// returns array of all data values
function getAllData(objectStore) {
	const os = db.transaction(objectStore).objectStore(objectStore);

	os.getAll().onsuccess = e => {
		console.log(e.target.result);
	}
}

// iterates through object store individually
function iterateAllData(objectStore) {
	const os = db.transaction(objectStore).objectStore(objectStore);

	os.openCursor().addEventListener("success", e => {
		const cursor = e.target.result;

		if (cursor) {

			console.log(cursor.key, cursor.value);

			cursor.continue();
		} else {
			console.log("all done");
		}
	});
}