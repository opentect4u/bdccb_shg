import { useCallback, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
// import { Message } from "../Components/Message"
// import { url } from "../Address/BaseUrl"
// import { routePaths } from "../Routes/routePaths"
import { getLocalStoreTokenDts } from "./getLocalforageTokenDts"
import { url } from "../Address/BaseUrl"
import { routePaths } from "../Assets/Data/Routes"
import { Message } from "./Message"
// import { getLocalStoreTokenDts } from "../Utils/authUtils"

const useCheckOpenCloseDate = (userDetails) => {
	const navigate = useNavigate()
	const [openDtCloseDt, setOpenDtCloseDt] = useState(null)
	const [loading, setLoading] = useState(false)

	const checkOpenDtCloseDt = useCallback(async () => {
		setLoading(true)

		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)

			const creds = {
				branch_code: userDetails?.brn_code,
			}

			const res = await axios.post(
				`${url}/admin/fetch_brnwise_end_details`,
				creds,
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (res?.data?.suc === 0) {
				localStorage.clear()
				Message("error", res?.data?.msg)
				navigate(routePaths.LANDING)
				return
			}

			if (res?.data?.end_flag === "C") {
				localStorage.setItem("pendingApprove", "yes")
				setOpenDtCloseDt(res?.data?.end_flag)
			} else {
				localStorage.setItem("pendingApprove", "no")
				setOpenDtCloseDt(res?.data?.end_flag)
			}
		} catch (error) {
			console.error("ERRR", error)
			Message("error", "Some error occurred while fetching data!")
		} finally {
			setLoading(false)
		}
	}, [userDetails?.brn_code, navigate])

	return {
		checkOpenDtCloseDt,
		openDtCloseDt,
		loading,
	}
}

export default useCheckOpenCloseDate
