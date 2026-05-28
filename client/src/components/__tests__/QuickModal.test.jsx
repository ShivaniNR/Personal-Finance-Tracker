import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the data/services the modal pulls in so the test stays focused on the
// component's own behavior (no real network, Supabase, or speech APIs).
vi.mock('../../services/categories', () => ({ getUserCategories: vi.fn() }));
vi.mock('../../services/ai', () => ({ parseTransactionAI: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { QuickAddModal } from '../QuickModal';
import { getUserCategories } from '../../services/categories';

function renderModal(props = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={client}>
      <QuickAddModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        isVoiceMode={false}
        setIsVoiceMode={() => {}}
        editingTransaction={null}
        {...props}
      />
    </QueryClientProvider>
  );
  return { onSubmit, onClose, ...utils };
}

beforeEach(() => {
  getUserCategories.mockResolvedValue([
    { id: '1', name: 'Food' },
    { id: '2', name: 'Salary' },
  ]);
});

describe('QuickAddModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the Add heading when not editing', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument();
  });

  it('pre-fills fields and shows the Edit heading when editing', () => {
    renderModal({
      editingTransaction: {
        id: 'abc',
        amount: 42,
        description: 'Groceries',
        type: 'EXPENSE',
        category: 'Food',
        date: '2026-05-10',
      },
    });
    expect(screen.getByRole('heading', { name: 'Edit Transaction' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(42);
    expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
  });

  it('submits the entered values and closes', async () => {
    const user = userEvent.setup();
    const { onSubmit, onClose } = renderModal();

    await user.type(screen.getByPlaceholderText('0.00'), '40');
    await user.type(screen.getByPlaceholderText('What did you spend on?'), 'Lunch');
    await user.click(screen.getByRole('button', { name: 'Add Transaction' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40, description: 'Lunch', type: 'EXPENSE' })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('submits type INCOME when the Income toggle is selected', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Income' }));
    await user.type(screen.getByPlaceholderText('0.00'), '3000');
    await user.type(screen.getByPlaceholderText('What did you spend on?'), 'Salary');
    await user.click(screen.getByRole('button', { name: 'Add Transaction' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 3000, type: 'INCOME' })
    );
  });

  it('renders fetched categories as options', async () => {
    renderModal();
    expect(await screen.findByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
