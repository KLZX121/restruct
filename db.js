let db;

function openDb(callback) {
	const openRequest = window.indexedDB.open("restruct_db", 4);

	openRequest.addEventListener("error", () => console.error("Database failed to open"));

	openRequest.addEventListener("success", () => {
		console.log("Database opened successfully");

		db = openRequest.result;

		callback();
	});

	openRequest.addEventListener("upgradeneeded", (e) => {
		db = e.target.result;
	
		console.log(`Upgrading database to version ${db.version}...`);
	
		// Check and create "reminders" object store
		if (!db.objectStoreNames.contains("reminders")) {
			const reminderObjectStore = db.createObjectStore("reminders", { keyPath: "id", autoIncrement: true });
			reminderObjectStore.createIndex("name", "name");
			reminderObjectStore.createIndex("date", "date");
			reminderObjectStore.createIndex("isFullDay", "isFullDay");
			console.log("Created 'reminders' object store.");
		} else {
			const reminderObjectStore = e.target.transaction.objectStore("reminders");
			if (!reminderObjectStore.indexNames.contains("name")) reminderObjectStore.createIndex("name", "name");
			if (!reminderObjectStore.indexNames.contains("date")) reminderObjectStore.createIndex("date", "date");
			if (!reminderObjectStore.indexNames.contains("isFullDay")) reminderObjectStore.createIndex("isFullDay", "isFullDay");
			console.log("Updated 'reminders' object store indexes.");
		}
	
		// Check and create "quicknotes" object store
		if (!db.objectStoreNames.contains("quicknotes")) {
			db.createObjectStore("quicknotes");
			console.log("Created 'quicknotes' object store.");
		}
	
		// Check and create "planner" object store
		if (!db.objectStoreNames.contains("planner")) {
			const plannerObjectStore = db.createObjectStore("planner", { keyPath: "id", autoIncrement: true });
			plannerObjectStore.createIndex("startTime", "startTime");
			plannerObjectStore.createIndex("endTime", "endTime");
			plannerObjectStore.createIndex("name", "name");
			plannerObjectStore.createIndex("description", "description");
			console.log("Created 'planner' object store.");
		} else {
			const plannerObjectStore = e.target.transaction.objectStore("planner");
			if (!plannerObjectStore.indexNames.contains("startTime")) plannerObjectStore.createIndex("startTime", "startTime");
			if (!plannerObjectStore.indexNames.contains("endTime")) plannerObjectStore.createIndex("endTime", "endTime");
			if (!plannerObjectStore.indexNames.contains("name")) plannerObjectStore.createIndex("name", "name");
			if (!plannerObjectStore.indexNames.contains("description")) plannerObjectStore.createIndex("description", "description");
			console.log("Updated 'planner' object store indexes.");
		}
	
		console.log("Database upgrade complete.");
	});
	
}

// adds or edits one entry
function addEditData(objectStore, data, isSingleton = false) {
	const transaction = db.transaction(objectStore, "readwrite")
	const os = transaction.objectStore(objectStore);

	let putReq;
	if (isSingleton) {
		putReq = os.put(data, 'singleton');
	} else {
		putReq = os.put(data);
	}
	
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
// id = 'singleton' for single entries
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