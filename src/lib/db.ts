import { ExtData, SearchMode } from "@kksh/api/models"
import { db, log, toast } from "@kksh/api/ui/custom"
import { Preferences, PreferencesSchema } from "./model"

export async function getPreferencesRawData(): Promise<ExtData | null> {
	const res = await db.search({
		searchMode: SearchMode.enum.ExactMatch,
		dataType: "preferences",
		fields: ["data"]
	})
	console.log("search result", res)

	if (res.length === 0) {
		return null
	} else if (res.length > 1) {
		return toast
			.error("More than one preferences found", {
				description: "All Preferences will be deleted, please set it again."
			})
			.then(() => {
				return Promise.all(res.map((r) => db.delete(r.dataId)))
			})
			.catch((err) => {
				log.error(`Error deleting preferences: ${err.toString()}`)
				toast.error("Error deleting preferences")
				return null
			})
			.then(() => {
				return null
			})
	} else {
		return res[0]
	}
}

export function getPreferences(): Promise<Preferences | null> {
	return getPreferencesRawData().then((res) => {
		if (res) {
			if (!res.data) {
				throw new Error("Preferences data is empty")
			}
			return PreferencesSchema.parse(JSON.parse(res.data))
		} else {
			return null
		}
	})
}

export async function setPreferences(pref: Preferences): Promise<void> {
	const res = await getPreferencesRawData()
	if (res) {
		await db.update({
			dataId: res.dataId,
			data: JSON.stringify(pref)
		})
	} else {
		await db.add({
			dataType: "preferences",
			data: JSON.stringify(pref)
		})
	}
}
