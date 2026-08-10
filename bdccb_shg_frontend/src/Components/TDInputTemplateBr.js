import React from "react"
import { Select } from "antd"

function TDInputTemplateBr(props) {
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	return (
		<>
			{props.label && (
				<label
					htmlFor={props.name}
					className={`block mb-2 text-sm capitalize font-bold ${props?.isColor ? props?.isColor : 'text-slate-800'} dark:text-gray-100`}
				>
					{props.mode !== 3
						? props.label
						: props.label +
						  " (" +
						  (props.formControlName?.length || "0") +
						  "/500)"}
					{props.required && (
						<span className="text-red-500">*</span>
					)}
				</label>
			)}
			{props.mode == 1 && (
				<input
					type={props.type}
					id={props.name}
					name={props.name}
					value={props.formControlName}
					multiple={props.multiple}
					min={props.min}
					accept={props.accept}
					max={props.max}
					className={`bg-white border-gray-400 ${props?.isColor ? `${props?.isColor} font-bold` : 'text-gray-800'} text-sm rounded-md ${
						userDetails?.id == 3
							? "focus:border-slate-800 active:border-slate-600 focus:ring-slate-600"
							: "focus:border-slate-800 active:border-slate-600 focus:ring-slate-600"
					} focus:border-1 duration-500 block w-full p-2 dark:bg-bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
					placeholder={props.placeholder}
					onChange={props.handleChange}
					onBlur={props?.handleBlur}
					disabled={props.disabled}
				/>
			)}
			{props.mode == 2 && (
				<Select
					showSearch
					allowClear
					className="w-full text-sm min-h-[38px]"
					id={props.name}
					name={props.name}
					value={(props.formControlName !== undefined && props.formControlName !== null && props.formControlName !== "undefined" && props.formControlName !== "" && String(props.formControlName) !== "0") ? String(props.formControlName) : undefined}
					placeholder={props.placeholder}
					onChange={(value) => {
						if (props.handleChange) {
							props.handleChange({ target: { name: props.name, value: value !== undefined && value !== null ? String(value) : "" } });
						}
					}}
					onBlur={() => props.handleBlur && props.handleBlur({ target: { name: props.name } })}
					filterOption={(input, option) =>
						(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
						(String(option?.value ?? '')).toLowerCase().includes(input.toLowerCase())
					}
					disabled={props.disabled}
					options={props?.data?.map((item) => ({
						value: item.code !== undefined && item.code !== null ? String(item.code) : "",
						label: item.name,
					}))}
				/>
			)}
			{props.mode == 3 && (
				<textarea
					rows="4"
					className={`bg-white border-1 border-gray-400 text-sm rounded-lg ${
						userDetails?.id == 3
							? "focus:border-slate-800 active:border-slate-600 focus:ring-slate-600"
							: "focus:border-slate-800 active:border-slate-600 focus:ring-slate-600"
					} focus:border-1 duration-500 block w-full p-2 dark:bg-bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`}
					name={props.name}
					value={props.formControlName}
					placeholder={props.placeholder}
					onChange={props.handleChange}
					onBlur={props.handleBlur}
					disabled={props.disabled}
					maxLength={500}
				/>
			)}
		</>
	)
}

export default TDInputTemplateBr
