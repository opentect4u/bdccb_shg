import axios from "axios"
// import { Message } from "../Components/Message"
import { url_bdccb } from "../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../Components/getLocalforageTokenDts"
import { Message } from "../Components/Message"
// import { getLocalStoreTokenDts } from "../Components/getLocalStoreTokenDts"
// import { Message } from "../../Components/Message"
// import { getLocalStoreTokenDts } from "../utils/authUtils"

export const saveMasterData = async ({
	endpoint,          // "master/save_gp"
	creds,             // dynamic payload
	navigate,          // react-router navigate
	onSuccess,         // success callback
	onFailure,         // failure callback
	onError,           // catch callback
	successMsg = "Data saved successfully",
	failureRedirect,   // dynamic redirect path (optional)
	clearStorage = false,
}) => {
	try {
		const tokenValue = await getLocalStoreTokenDts(navigate)

		const res = await axios.post(
			`${url_bdccb}/${endpoint}`,
			creds,
			{
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			}
		)

		if (res?.data?.success) {
			// Message("success", successMsg)
			Message("success", res?.data?.msg)
			onSuccess && onSuccess(res)
		} else {

			Message("error", res?.data?.msg || "Request failed")

			// if (clearStorage) {
			// 	localStorage.clear()
			// }

			// if (failureRedirect && navigate) {
			// 	navigate(failureRedirect)
			// }

			onFailure && onFailure(res)
		}
	} catch (err) {
		Message("error", "Some error occurred.")
		console.error("API ERROR:", err)

		onError && onError(err)
	}
}
