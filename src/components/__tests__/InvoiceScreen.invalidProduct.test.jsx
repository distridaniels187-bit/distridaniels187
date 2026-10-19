import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VENDEDORES } from '../../config/empresa';
import InvoiceScreen from '../InvoiceScreen';

const mockNavigate = jest.fn();
let mockProductStock = 10;
let mockMovementInsertError = null;

jest.mock('../supabaseClient', () => {
  const mockSupabase = {
    from: jest.fn((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn((query) => {
            if (query.includes('stock') && query.includes('activo')) {
              return {
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({
                      data: {
                        id: 1,
                        nombre: 'Producto real',
                        stock: mockProductStock,
                        activo: true,
                      },
                      error: null,
                    })
                  ),
                })),
              };
            }

            if (query === 'stock') {
              return {
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({
                      data: { stock: mockProductStock },
                      error: null,
                    })
                  ),
                })),
              };
            }

            return {
              order: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: 1,
                      nombre: 'Producto real',
                      stock: 10,
                      precio: 5000,
                      costo_compra: 3000,
                      activo: true,
                    },
                  ],
                  error: null,
                })
              ),
            };
          }),
          update: jest.fn((values) => {
            const builder = {
              error: null,
              eq: jest.fn(() => builder),
              select: jest.fn(() => ({
                maybeSingle: jest.fn(() => {
                  if (values.stock !== undefined) {
                    mockProductStock = values.stock;
                  }
                  return Promise.resolve({
                    data: { stock: mockProductStock },
                    error: null,
                  });
                }),
              })),
            };
            return builder;
          }),
        };
      }

      if (table === 'clientes') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }

      if (table === 'facturas') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: [{ id: 101 }],
                error: null,
              })
            ),
          })),
        };
      }

      if (table === 'movimientos_inventario') {
        return { insert: jest.fn(() => Promise.resolve({ error: mockMovementInsertError })) };
      }

      return {};
    }),
  };

  return { supabase: mockSupabase };
});

jest.mock('../../context/auth-context', () => ({
  useAuth: () => ({
    user: { username: 'admin', role: 'admin' },
  }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('InvoiceScreen - flujo de factura con producto inválido', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProductStock = 10;
    mockMovementInsertError = null;
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
    mockNavigate.mockClear();
  });

  test('permite guardar la factura aunque haya un producto sin producto_id válido', async () => {
    render(
      <MemoryRouter>
        <InvoiceScreen />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/cliente/i), {
      target: { value: 'Cliente prueba' },
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre \*/i), {
      target: { value: 'Producto sin catálogo' },
    });

    fireEvent.change(screen.getByPlaceholderText(/cantidad \*/i), {
      target: { value: '2' },
    });

    fireEvent.change(screen.getByPlaceholderText(/precio \*/i), {
      target: { value: '2500' },
    });

    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: VENDEDORES[0].nombre },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /vista previa y guardar/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /guardar/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/factura/101');
    });
  });

  test('ajusta el stock de una factura cuando el movimiento no puede guardarse', async () => {
    mockMovementInsertError = { message: 'No se pudo insertar el movimiento' };

    render(
      <MemoryRouter>
        <InvoiceScreen />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/cliente/i), {
      target: { value: 'Cliente prueba' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nombre \*/i), {
      target: { value: 'Producto real' },
    });
    fireEvent.change(screen.getByPlaceholderText(/cantidad \*/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByPlaceholderText(/precio \*/i), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: VENDEDORES[0].nombre },
    });
    fireEvent.click(screen.getByRole('button', { name: /vista previa y guardar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(mockProductStock).toBe(8);
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('inventario quedó en 8')
      );
      expect(mockNavigate).toHaveBeenCalledWith('/factura/101');
    });
  });
});
