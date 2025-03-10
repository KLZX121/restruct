const DB_NAME = 'restruct_db';
const DB_VERS = 6;

// if PROD_MODE is true, all object stores will be cleared
const PROD_MODE = true;

let db;


class ObjectStoreData {
	osName;
	dataKeys = [];

	constructor(name, keys) {
		this.osName = name;
		this.dataKeys = keys;
	}
}

const objectStoreStructures = [
	new ObjectStoreData('reminders', ['id', 'name', 'dateType', 'dateTime']),
	new ObjectStoreData('quicknotes', []),
	new ObjectStoreData('planner', ['startTime', 'endTime', 'name', 'description'])
];


function openDb(callback) {
	const openRequest = window.indexedDB.open(DB_NAME, DB_VERS);

	openRequest.addEventListener("error", () => console.error("Database failed to open"));

	openRequest.addEventListener("success", () => {
		db = openRequest.result;

		callback();
	});

	openRequest.addEventListener("upgradeneeded", (e) => {
		db = e.target.result;
	
		console.log('UPGRADING DB');

		if (PROD_MODE) {
			objectStoreStructures.forEach(os => db.deleteObjectStore(os.osName));
		}

		objectStoreStructures.forEach(osObj => {
			let os;
			// create key if 'id' data field exists
			if (osObj.dataKeys.includes('id')) {
				os = db.createObjectStore(osObj.osName, {keyPath: 'id', autoIncrement: true});
			} else {
				os = db.createObjectStore(osObj.osName);
			}

			osObj.dataKeys.forEach(osDataKey => {
				if (osDataKey != 'id') os.createIndex(osDataKey, osDataKey);
			})
		})

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