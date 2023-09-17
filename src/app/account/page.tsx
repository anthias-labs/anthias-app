"use client";

import styles from "./page.module.scss";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CopyButton, Loader, Tooltip, ActionIcon } from "@mantine/core";
import { useRouter } from "next/navigation";
import fetchSession from "../_api/fetchSession";
import Link from "next/link";
import { motion } from "framer-motion";
import fetchReferralCode from "../_api/fetchReferralCode";
import { getHash } from "../_utils/textHandling";
import { PieChart, Pie, Cell, Label } from "recharts";

export default function AccountPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [pieData, setPieData] = useState([]);
  const COLORS = ["#1fcfcf", "#219595"];

  useEffect(() => {
    async function checkSession() {
      const session = await fetchSession();

      if (session.data.session) {
        setSession(session.data.session);
        fetchReferralData(session);
      } else {
        router.push("/account/login");
      }
    }

    async function fetchReferralData(session) {
      const uid = session.data.session.user.id;

      const referralData = await fetchReferralCode(uid);

      if (referralData) {
        setReferralData(referralData);
        setPieData([
          { name: "Referrals Made", value: referralData.code_count },
          {
            name: "Referrals Remaining",
            value: referralData.max_count - referralData.code_count,
          },
        ]);
      } else {
        const hash = getHash();
        const { data, error } = await supabase
          .from("_referral_codes")
          .insert([{ auth_uid: uid, code: hash, code_count: 0 }]);

        if (error) {
          console.log(error);
          return;
        }

        fetchReferralData(session);
      }
    }

    checkSession();
  }, []);

  async function handleLogOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    router.push("/account/login");
    router.refresh();
    setLoading(false);
  }

  return referralData ? (
    <motion.div
      className={styles.account}
      initial={{ opacity: 0, y: 50 }}
      animate={{
        opacity: [0, 1],
        y: [50, 0],
      }}
      transition={{
        duration: 0.2,
        delay: 0.1,
      }}
    >
      <div className={styles.title}>
        <h1>
          Earn <span>ANTH</span> points now that you are an Anthias fisher!
        </h1>
        <div className={styles.logout} onClick={handleLogOut}>
          Log Out
        </div>
      </div>
      <div className={styles.info}>
        Now that you are a member of Anthias, you can earn <span>ANTH </span>
        points by sharing your unique invite code and interacting with the
        Anthias platform. Each signup through your code will generate{" "}
        <span>ANTH</span> points will bring great (unannounced) rewards for
        their holders...
      </div>
      <div className={styles.sections}>
        <div className={styles.section}>
          <div className={styles.box}>
            <h2>Your Referral Code</h2>
            <div className={styles.codeBox}>
              <p>{referralData.code}</p>
              <CopyButton value={referralData.code}>
                {({ copied, copy }) => (
                  <div className={styles.copyIcon} onClick={copy}>
                    {copied ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                      </svg>
                    ) : (
                      <svg
                        width="800"
                        height="800"
                        viewBox="0 0 800 800"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.clipBoardIcon}
                      >
                        <path d="M722.305 129.89H614.252V34.0132C614.252 15.2289 599.023 0 580.238 0H77.6954C58.911 0 43.6821 15.2289 43.6821 34.0132V636.097C43.6821 654.882 58.911 670.11 77.6954 670.11H185.746V765.985C185.746 784.769 200.975 799.998 219.76 799.998H722.305C741.089 799.998 756.318 784.769 756.318 765.985V163.903C756.318 145.119 741.089 129.89 722.305 129.89ZM111.709 602.084V68.0264H546.223V129.89H219.762C200.977 129.89 185.749 145.119 185.749 163.903V602.084H111.709ZM688.292 731.974H253.775V197.916H688.292V731.974Z" />
                      </svg>
                    )}
                  </div>
                )}
              </CopyButton>
            </div>
          </div>
          <div className={styles.box}>
            <h2>Your Referral Link</h2>

            <div className={styles.codeBox}>
              <p>{`app.anthias.xyz/account/signup?referral=${referralData.code}`}</p>
              <CopyButton
                value={`app.anthias.xyz/account/signup?referral=${referralData.code}`}
              >
                {({ copied, copy }) => (
                  <div className={styles.copyIcon} onClick={copy}>
                    {copied ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                      </svg>
                    ) : (
                      <svg
                        width="800"
                        height="800"
                        viewBox="0 0 800 800"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.clipBoardIcon}
                      >
                        <path d="M722.305 129.89H614.252V34.0132C614.252 15.2289 599.023 0 580.238 0H77.6954C58.911 0 43.6821 15.2289 43.6821 34.0132V636.097C43.6821 654.882 58.911 670.11 77.6954 670.11H185.746V765.985C185.746 784.769 200.975 799.998 219.76 799.998H722.305C741.089 799.998 756.318 784.769 756.318 765.985V163.903C756.318 145.119 741.089 129.89 722.305 129.89ZM111.709 602.084V68.0264H546.223V129.89H219.762C200.977 129.89 185.749 145.119 185.749 163.903V602.084H111.709ZM688.292 731.974H253.775V197.916H688.292V731.974Z" />
                      </svg>
                    )}
                  </div>
                )}
              </CopyButton>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <div className={`${styles.box} ${styles.pieChartContainer}`}>
            <h2>Referrals Made</h2>
            <PieChart width={180} height={180}>
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={75}
                fill="#1fcfcf1e"
                startAngle={0}
                endAngle={360}
                stroke="none"
                style={{ outline: "none", boxShadow: "none" }}
              />

              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={90}
                startAngle={0}
                stroke="none"
                style={{ outline: "none", boxShadow: "none" }}
              >
                <Label
                  position="center"
                  offset={0}
                  value={`${referralData.code_count}/${referralData.max_count} Referrals`}
                  style={{
                    fontSize: "1rem",
                    fill: "white",
                    fontWeight: "100",
                    cursor: "text",
                  }}
                />
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className={styles.side}>
            <div className={styles.box}>
              <h2>
                Your <span>ANTH</span> Points
              </h2>
              <div className={styles.codeBox}>
                <h3>
                  {referralData.code_count * 10} <span>ANTH</span>
                </h3>
              </div>
            </div>
            <div className={styles.box}>
              <h2>Global Leaderboard Rank</h2>
              <div className={styles.codeBox}>
                <h3>
                  <span>#33</span> / 200
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  ) : (
    <div className={styles.loaderContainer}>
      <Loader color="#1fcfcf" size={64} />
    </div>
  );
}
