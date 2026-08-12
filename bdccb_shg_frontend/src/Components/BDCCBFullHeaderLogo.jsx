import React from "react"
import ssvwsLogo from "../Assets/Images/ssvws_logo.jpg"

export const BDCCBFullHeaderLogo = ({ className = "" }) => {
	return (
		<img
			src={ssvwsLogo}
			alt="Bankura District Central Cooperative Bank Ltd."
			className={`h-12 md:h-16 object-contain max-w-full ${className}`}
		/>
	)
}

export default BDCCBFullHeaderLogo
