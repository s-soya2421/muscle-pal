import { render, screen } from '@testing-library/react'
import { MainLayout } from '@/components/layout/main-layout'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock Sidebar component
jest.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => (
    <div data-testid="sidebar">
      <h2>MusclePal</h2>
      <nav>
        <a href="/dashboard">ホーム</a>
        <a href="/posts">投稿</a>
        <a href="/profile">プロフィール</a>
      </nav>
    </div>
  ),
}))

describe('MainLayout', () => {
  it('renders main content correctly', () => {
    render(
      <MainLayout>
        <div data-testid="main-content">メインコンテンツ</div>
      </MainLayout>
    )

    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByText('メインコンテンツ')).toBeInTheDocument()
  })

  it('renders left sidebar with navigation', () => {
    render(
      <MainLayout>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    // Check if sidebar navigation links exist
    expect(screen.getByText('ホーム')).toBeInTheDocument()
    expect(screen.getByText('投稿')).toBeInTheDocument()
    expect(screen.getByText('プロフィール')).toBeInTheDocument()
  })

  it('renders right sidebar when provided', () => {
    const rightSidebar = (
      <div data-testid="right-sidebar">
        <h3>右サイドバー</h3>
      </div>
    )

    render(
      <MainLayout rightSidebar={rightSidebar}>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument()
    expect(screen.getByText('右サイドバー')).toBeInTheDocument()
  })

  it('does not render right sidebar when not provided', () => {
    render(
      <MainLayout>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    expect(screen.queryByTestId('right-sidebar')).not.toBeInTheDocument()
  })

  it('renders mobile navigation', () => {
    render(
      <MainLayout>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    // Check if mobile navigation exists (though hidden on desktop)
    const mobileNav = screen.getByRole('navigation', { hidden: true })
    expect(mobileNav).toBeInTheDocument()
  })

  it('has correct CSS classes for responsive layout', () => {
    const { container } = render(
      <MainLayout>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    const mainContainer = container.querySelector('.min-h-screen.bg-gray-50.flex')
    expect(mainContainer).toBeInTheDocument()

    const leftSidebar = container.querySelector('.hidden.md\\:block')
    expect(leftSidebar).toBeInTheDocument()

    const mainContent = container.querySelector('.flex-1.max-w-2xl.bg-white.border-x.min-h-screen')
    expect(mainContent).toBeInTheDocument()
  })

  it('renders MusclePal logo in sidebar', () => {
    render(
      <MainLayout>
        <div>メインコンテンツ</div>
      </MainLayout>
    )

    expect(screen.getByText('MusclePal')).toBeInTheDocument()
  })
})