// Hand-written types for the tables we use today. Replace with output of
// `supabase gen types typescript` once the schema is finalised.
// Aligned with supabase/migrations/0001_cotizaciones.sql.

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada';

export type Database = {
  // Required by @supabase/postgrest-js >= 2.x for the typed query builder to
  // resolve the schema. Replace this when we move to `supabase gen types`.
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          rut: string;
          razon_social: string;
          persona: string | null;
          direccion_despacho: string | null;
          condicion_de_pago: string | null;
          ciudad: string | null;
          contacto: string | null;
          email: string | null;
          giro: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clientes']['Row']>;
        Relationships: [];
      };

      productos: {
        Row: {
          codigo_sku: string;
          descripcion: string;
          precio_neto: number;
        };
        Insert: Database['public']['Tables']['productos']['Row'];
        Update: Partial<Database['public']['Tables']['productos']['Row']>;
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          nombre_completo: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre_completo: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      cotizaciones: {
        Row: {
          id: string;
          numero: number;
          cliente_rut: string;
          vendedor_id: string;
          fecha: string;
          vencimiento: string;
          condicion_pago: string | null;
          estado: EstadoCotizacion;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero?: number;
          cliente_rut: string;
          vendedor_id: string;
          fecha?: string;
          vencimiento?: string;
          condicion_pago?: string | null;
          estado?: EstadoCotizacion;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cotizaciones']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'cotizaciones_cliente_rut_fkey';
            columns: ['cliente_rut'];
            referencedRelation: 'clientes';
            referencedColumns: ['rut'];
          },
          {
            foreignKeyName: 'cotizaciones_vendedor_id_fkey';
            columns: ['vendedor_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      cotizacion_items: {
        Row: {
          id: string;
          cotizacion_id: string;
          posicion: number;
          codigo_sku: string;
          descripcion: string;
          precio_unitario: number;
          cantidad: number;
          descuento_porcentaje: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cotizacion_id: string;
          posicion: number;
          codigo_sku: string;
          descripcion: string;
          precio_unitario: number;
          cantidad: number;
          descuento_porcentaje?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cotizacion_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'cotizacion_items_cotizacion_id_fkey';
            columns: ['cotizacion_id'];
            referencedRelation: 'cotizaciones';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
