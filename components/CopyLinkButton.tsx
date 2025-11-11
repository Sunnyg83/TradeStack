'use client'

export default function CopyLinkButton({ slug }: { slug: string }) {
  const handleCopy = () => {
    const url = `${window.location.origin}/biz/${slug}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Copy Link
    </button>
  )
}



