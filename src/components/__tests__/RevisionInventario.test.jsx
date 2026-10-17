import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import RevisionInventario from '../RevisionInventario';

const mockRpc = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [{ id: 42, nombre: 'Shampoo Nutribela', stock: 18 }],
          error: null
        }))
      }))
    })),
    rpc: (...args) => mockRpc(...args)
  }
}));

jest.mock('../../context/auth-context', () => ({
  useAuth: () => ({ user: { username: 'Revisora', role: 'admin' } })
}));

describe('RevisionInventario', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockRpc.mockImplementation((functionName) => Promise.resolve({
      data: functionName === 'obtener_ultimas_revisiones_inventario'
        ? []
        : { revision_id: 1 },
      error: null
    }));
  });

  test('muestra stock del sistema y guarda el conteo como una revisión', async () => {
    render(<RevisionInventario />);

    expect(await screen.findByText('Shampoo Nutribela')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '18' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Conteo físico para Shampoo Nutribela'), {
      target: { value: '24' }
    });
    expect(screen.getByText('+6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Guardar conteo|Confirmar ajuste/ }));

    await waitFor(() => expect(mockRpc).toHaveBeenCalledWith(
      'guardar_revision_inventario',
      {
        p_producto_id: 42,
        p_stock_sistema: 18,
        p_stock_real: 24,
        p_revisado_por: 'Revisora',
        p_rol_usuario: 'admin',
        p_observacion: ''
      }
    ));
    expect(await screen.findByText(/stock fue ajustado de 18 a 24/)).toBeInTheDocument();
  });

  test.each(['-1', '1.5'])('rechaza el conteo inválido %s', async (cantidad) => {
    render(<RevisionInventario />);

    await screen.findByText('Shampoo Nutribela');
    fireEvent.change(screen.getByLabelText('Conteo físico para Shampoo Nutribela'), {
      target: { value: cantidad }
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar conteo|Confirmar ajuste/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La cantidad contada debe ser un número entero igual o mayor que cero.'
    );
    expect(mockRpc).not.toHaveBeenCalledWith(
      'guardar_revision_inventario',
      expect.anything()
    );
  });
});
