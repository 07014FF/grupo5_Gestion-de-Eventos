


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."decrement_available_tickets"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."decrement_available_tickets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone DEFAULT ("now"() - '30 days'::interval), "end_date" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("gateway" "text", "total_transactions" bigint, "successful_transactions" bigint, "failed_transactions" bigint, "total_amount" numeric, "avg_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.payment_gateway,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'completed') as successful_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'failed') as failed_transactions,
    SUM(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as total_amount,
    AVG(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as avg_amount
  FROM public.purchases p
  WHERE p.created_at BETWEEN start_date AND end_date
  GROUP BY p.payment_gateway;
END;
$$;


ALTER FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) IS 'Obtiene estadísticas de pagos por pasarela en un rango de fechas';



CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'client');
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_available_tickets"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.events
    SET available_tickets = available_tickets + 1
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_available_tickets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_completed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si el estado cambia a 'completed', establecer timestamp
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    NEW.payment_completed_at = NOW();
  END IF;

  -- Si el estado cambia de 'completed' a otro, limpiar timestamp
  IF NEW.payment_status != 'completed' AND OLD.payment_status = 'completed' THEN
    NEW.payment_completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_completed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "subtitle" character varying(255),
    "description" "text",
    "image_url" "text",
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "location" character varying(255) NOT NULL,
    "venue" character varying(255),
    "price" numeric(10,2) NOT NULL,
    "available_tickets" integer NOT NULL,
    "total_tickets" integer NOT NULL,
    "category" character varying(100),
    "rating" numeric(3,2),
    "status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "events_available_tickets_check" CHECK (("available_tickets" >= 0)),
    CONSTRAINT "events_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "events_rating_check" CHECK ((("rating" >= (0)::numeric) AND ("rating" <= (5)::numeric))),
    CONSTRAINT "events_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "events_total_tickets_check" CHECK (("total_tickets" > 0))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Eventos disponibles para compra de tickets';



COMMENT ON COLUMN "public"."events"."available_tickets" IS 'Tickets disponibles (se decrementa con cada compra)';



COMMENT ON COLUMN "public"."events"."status" IS 'Estado: draft, active, cancelled, completed';



CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "transaction_id" character varying(255),
    "user_name" character varying(255) NOT NULL,
    "user_email" character varying(255) NOT NULL,
    "user_phone" character varying(50),
    "user_document" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_gateway" "text" DEFAULT 'culqi'::"text",
    "payment_transaction_id" "text",
    "payment_receipt_url" "text",
    "payment_metadata" "jsonb",
    "payment_completed_at" timestamp with time zone,
    CONSTRAINT "purchases_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['card'::character varying, 'pse'::character varying, 'nequi'::character varying, 'daviplata'::character varying])::"text"[]))),
    CONSTRAINT "purchases_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[]))),
    CONSTRAINT "purchases_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchases" IS 'Registro de compras realizadas por usuarios';



COMMENT ON COLUMN "public"."purchases"."payment_method" IS 'Método de pago: card, yape, plin (Perú), pse, nequi, daviplata (Colombia)';



COMMENT ON COLUMN "public"."purchases"."payment_status" IS 'Estado del pago: pending, completed, failed, refunded';



COMMENT ON COLUMN "public"."purchases"."payment_gateway" IS 'Pasarela de pago utilizada: culqi (Perú), mock (desarrollo), stripe, mercadopago';



COMMENT ON COLUMN "public"."purchases"."payment_transaction_id" IS 'ID de transacción de la pasarela de pago (charge_id en Culqi)';



COMMENT ON COLUMN "public"."purchases"."payment_receipt_url" IS 'URL al recibo o comprobante de pago generado';



COMMENT ON COLUMN "public"."purchases"."payment_metadata" IS 'Datos adicionales de la pasarela: info de tarjeta, banco, referencia, etc.';



COMMENT ON COLUMN "public"."purchases"."payment_completed_at" IS 'Timestamp cuando el pago fue confirmado exitosamente';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(50),
    "document" character varying(100),
    "role" character varying(50) DEFAULT 'client'::character varying NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['client'::character varying, 'admin'::character varying, 'super_admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Perfiles de usuario extendidos que complementan auth.users';



COMMENT ON COLUMN "public"."users"."role" IS 'Rol del usuario: client (default), admin, super_admin';



CREATE OR REPLACE VIEW "public"."purchases_with_payment_info" AS
 SELECT "p"."id",
    "p"."user_id",
    "p"."event_id",
    "p"."total_amount",
    "p"."payment_method",
    "p"."payment_status",
    "p"."payment_gateway",
    "p"."payment_transaction_id",
    "p"."transaction_id",
    "p"."payment_completed_at",
    "p"."created_at",
    "u"."name" AS "user_name",
    "u"."email" AS "user_email",
    "e"."title" AS "event_title",
    "e"."date" AS "event_date",
    ("p"."payment_metadata" ->> 'brand'::"text") AS "card_brand",
    ("p"."payment_metadata" ->> 'last_four'::"text") AS "card_last_four",
    ("p"."payment_metadata" ->> 'bank'::"text") AS "bank_name"
   FROM (("public"."purchases" "p"
     LEFT JOIN "public"."users" "u" ON (("p"."user_id" = "u"."id")))
     LEFT JOIN "public"."events" "e" ON (("p"."event_id" = "e"."id")));


ALTER VIEW "public"."purchases_with_payment_info" OWNER TO "postgres";


COMMENT ON VIEW "public"."purchases_with_payment_info" IS 'Vista consolidada de compras con información de pago y referencias';



CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_code" character varying(50) NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_type" character varying(100) DEFAULT 'General'::character varying NOT NULL,
    "seat_number" character varying(50),
    "price" numeric(10,2) NOT NULL,
    "qr_code_data" "text" NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "used_at" timestamp with time zone,
    "validated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tickets_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "tickets_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


COMMENT ON TABLE "public"."tickets" IS 'Tickets individuales generados por cada compra';



COMMENT ON COLUMN "public"."tickets"."ticket_code" IS 'Código único del ticket (usado en QR)';



COMMENT ON COLUMN "public"."tickets"."status" IS 'Estado: active, used, expired, cancelled';



CREATE TABLE IF NOT EXISTS "public"."validations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "validated_by" "uuid" NOT NULL,
    "validation_result" character varying(50) NOT NULL,
    "validation_message" "text",
    "device_info" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "validations_validation_result_check" CHECK ((("validation_result")::"text" = ANY ((ARRAY['valid'::character varying, 'invalid'::character varying, 'already_used'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."validations" OWNER TO "postgres";


COMMENT ON TABLE "public"."validations" IS 'Registro de validaciones de tickets en eventos';



COMMENT ON COLUMN "public"."validations"."validation_result" IS 'Resultado: valid, invalid, already_used, expired, cancelled';



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_code_key" UNIQUE ("ticket_code");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."validations"
    ADD CONSTRAINT "validations_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_events_category" ON "public"."events" USING "btree" ("category");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_events_date" ON "public"."events" USING "btree" ("date");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_purchases_created_at" ON "public"."purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_purchases_event_id" ON "public"."purchases" USING "btree" ("event_id");



CREATE INDEX "idx_purchases_payment_completed_at" ON "public"."purchases" USING "btree" ("payment_completed_at" DESC) WHERE ("payment_completed_at" IS NOT NULL);



CREATE INDEX "idx_purchases_payment_gateway" ON "public"."purchases" USING "btree" ("payment_gateway");



CREATE INDEX "idx_purchases_payment_status" ON "public"."purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_purchases_payment_transaction_id" ON "public"."purchases" USING "btree" ("payment_transaction_id") WHERE ("payment_transaction_id" IS NOT NULL);



CREATE INDEX "idx_purchases_transaction_id" ON "public"."purchases" USING "btree" ("transaction_id");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");



CREATE INDEX "idx_tickets_purchase_id" ON "public"."tickets" USING "btree" ("purchase_id");



CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");



CREATE INDEX "idx_tickets_ticket_code" ON "public"."tickets" USING "btree" ("ticket_code");



CREATE INDEX "idx_tickets_user_id" ON "public"."tickets" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_validations_created_at" ON "public"."validations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_validations_ticket_id" ON "public"."validations" USING "btree" ("ticket_id");



CREATE INDEX "idx_validations_validated_by" ON "public"."validations" USING "btree" ("validated_by");



CREATE OR REPLACE TRIGGER "trigger_decrement_tickets" AFTER INSERT ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_available_tickets"();



CREATE OR REPLACE TRIGGER "trigger_increment_tickets" AFTER UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."increment_available_tickets"();



CREATE OR REPLACE TRIGGER "trigger_update_payment_completed_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_completed_at"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchases_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."validations"
    ADD CONSTRAINT "validations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."validations"
    ADD CONSTRAINT "validations_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id");



CREATE POLICY "Admins can delete events" ON "public"."events" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can insert events" ON "public"."events" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can insert validations" ON "public"."validations" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can update tickets" ON "public"."tickets" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can view all purchases" ON "public"."purchases" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can view all tickets" ON "public"."tickets" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Admins can view all validations" ON "public"."validations" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Anyone can view active events" ON "public"."events" FOR SELECT USING ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying])::"text"[])));



CREATE POLICY "Users can create purchases" ON "public"."purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create tickets" ON "public"."tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own purchases" ON "public"."purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ticket validations" ON "public"."validations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tickets"
  WHERE (("tickets"."id" = "validations"."ticket_id") AND ("tickets"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own tickets" ON "public"."tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."validations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."decrement_available_tickets"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_available_tickets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_available_tickets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_available_tickets"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_available_tickets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_available_tickets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_completed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_completed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_completed_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."purchases_with_payment_info" TO "anon";
GRANT ALL ON TABLE "public"."purchases_with_payment_info" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases_with_payment_info" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."validations" TO "anon";
GRANT ALL ON TABLE "public"."validations" TO "authenticated";
GRANT ALL ON TABLE "public"."validations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
