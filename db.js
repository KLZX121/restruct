let db;

function openDb(callback) {
	const openRequest = window.indexedDB.open("restruct_db", 1);

	openRequest.addEventListener("error", () => console.error("Database failed to open"));

	openRequest.addEventListener("success", () => {
		console.log("Database opened successfully");

		db = openRequest.result;

		callback();
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

// adds or edits one entry
function addEditData(objectStore, data) {
	const transaction = db.transaction(objectStore, "readwrite")
	const os = transaction.objectStore(objectStore);

	const putReq = os.put(data);
	
	putReq.addEventListener("success", e => {
		const dataId = e.target.result;
		console.log(dataId);
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
	return new Promise((resolve, reject) => {		
		const transaction = db.transaction(objectStore);
		const os = transaction.objectStore(objectStore);
	
		const getReq = os.get(id);
	
		getReq.onsuccess = () => {
			resolve(getReq.result);
		}
	
		getReq.onerror = e => {
			reject(e);
		}
	});
}

// returns array of all data values
function getAllData(objectStore) {
	return new Promise((resolve, reject) => {
		const os = db.transaction(objectStore).objectStore(objectStore);
		
		os.getAll().onsuccess = e => resolve(e.target.result);
	});
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