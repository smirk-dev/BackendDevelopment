--
-- PostgreSQL database dump
--

\restrict TA1cyTlFSGwxrt8OV4XSBzDfkCz26dI5u3i3WKZRLamZlc6G48dgJCMuUHmKLbO

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    branch character varying(50),
    email character varying(255),
    enrollment_date date DEFAULT CURRENT_DATE,
    profile jsonb
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.students ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, branch, email, enrollment_date, profile) FROM stdin;
3	Carla Gomez	CSE	carla@example.com	2024-03-02	\N
5	Ethan Brooks	CSE	ethan@example.com	2024-02-18	\N
8	Farah Ali	IT	farah@example.com	2026-09-27	\N
1	Alice Sharma	CSE	alice@example.com	2024-01-15	{"clubs": {"robotics": true}, "skills": ["python", "sql"]}
2	Bilal Khan	AI/ML	bilal@example.com	2023-08-10	{"clubs": {"music": true, "robotics": false}, "skills": ["c", "verilog"]}
\.


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 8, true);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: idx_students_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_profile ON public.students USING gin (profile);


--
-- PostgreSQL database dump complete
--

\unrestrict TA1cyTlFSGwxrt8OV4XSBzDfkCz26dI5u3i3WKZRLamZlc6G48dgJCMuUHmKLbO

