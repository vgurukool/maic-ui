import React from 'react'
import { Button } from '@/components/ui/Button'
import { DocumentVersion } from '@/components/WebEditor'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface VersionListProps {
	versions: DocumentVersion[]
	onApplyVersion: (version: DocumentVersion) => void
	onDeleteVersion: (version: DocumentVersion) => void
	className?: string
	label?: string
}

const formatDate = (dateString: string, language: string = 'en') => {
	const date = new Date(dateString)
	return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}

export function VersionList({
	versions,
	onApplyVersion,
	onDeleteVersion,
	className,
	label
}: VersionListProps) {
	const { language, t } = useLanguage()

	if (!versions.length) {
		return null
	}

	const sortedVersions = [...versions].sort((a, b) => {
		if (a.isCurrent && !b.isCurrent) return -1
		if (!a.isCurrent && b.isCurrent) return 1
		const aVersion = a.versionNumber ?? 0
		const bVersion = b.versionNumber ?? 0
		return aVersion - bVersion
	})

	const displayLabel = label || t('version.default_label')

	return (
		<div className={`bg-white rounded-lg shadow p-6 ${className || ''}`.trim()}>
			<h2 className="text-xl font-semibold text-gray-900 mb-4">{displayLabel}</h2>
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{t('version.title')}
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{t('version.date')}
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{t('version.instruction')}
							</th>
							<th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								{t('version.action')}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						{sortedVersions.map((version) => (
							<tr
								key={version.id}
								className={version.isCurrent ? 'bg-green-50' : 'bg-white'}
							>
								<td className="px-4 py-3 text-sm font-semibold text-gray-900">
									<div className="flex items-center gap-2">
										<span>{`v${version.versionNumber ?? '-'}`}</span>
										{version.isCurrent && (
											<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
												{t('version.current')}
											</span>
										)}
									</div>
								</td>
								<td className="px-4 py-3 text-sm text-gray-600">{formatDate(version.modifiedDate, language)}</td>
								<td className="px-4 py-3 text-sm text-gray-600">
									<div className="truncate max-w-[360px]" title={version.modificationPrompt || t('version.no_prompt')}>
										{version.modificationPrompt === '无修改指令' ? t('version.no_prompt') : (version.modificationPrompt || t('version.no_prompt'))}
									</div>
								</td>
								<td className="px-4 py-3 text-right">
									{!version.isCurrent && (
										<div className="flex items-center justify-end gap-2">
											<Button
												onClick={() => onApplyVersion(version)}
												className="px-4 py-2 text-sm"
											>
												{t('version.apply')}
											</Button>
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
