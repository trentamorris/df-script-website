import React from "react";
import { ArticleCanvas, TabShelf, Tab } from "../../../elements";
import { LLM_PATH, LLM_FULL_PATH, LLM_TXT_PATH } from "../../constants";
import type { LlmViewProps } from "./types";

type LlmFileTab = "llms.txt" | "llms-full.txt";

export function LlmView({ path }: LlmViewProps) {
  const initialTab: LlmFileTab =
    path === LLM_FULL_PATH ? "llms-full.txt" : "llms.txt";

  const [activeTab, setActiveTab] = React.useState<LlmFileTab>(initialTab);
  const [content, setContent] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Sync state if path changes externally
  React.useEffect(() => {
    if (path === LLM_FULL_PATH) {
      setActiveTab("llms-full.txt");
    } else if (path === LLM_TXT_PATH || path === LLM_PATH) {
      setActiveTab("llms.txt");
    }
  }, [path]);

  const handleTabChange = (tab: LlmFileTab) => {
    setActiveTab(tab);
    const targetPath = tab === "llms-full.txt" ? LLM_FULL_PATH : LLM_TXT_PATH;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  };

  React.useEffect(() => {
    setIsLoading(true);
    fetch(`/${activeTab}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${activeTab}`);
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setContent(`# Error\n\nFailed to load ${activeTab}.`);
        setIsLoading(false);
      });
  }, [activeTab]);

  const header = (
    <div className="sticky top-0 z-30 bg-[#060606]/95 backdrop-blur-md pt-2 -mx-4 px-4 border-b border-white/[0.06] flex items-center justify-between">
      <TabShelf<LlmFileTab>
        activeValue={activeTab}
        onChange={handleTabChange}
      >
        <Tab value="llms.txt">llms.txt</Tab>
        <Tab value="llms-full.txt">llms-full.txt</Tab>
      </TabShelf>

      <p className="pb-3 text-[10px] text-zinc-500 uppercase tracking-wider select-none hidden sm:block">
        {activeTab === "llms.txt" ? "High-Level Overview" : "Complete API Reference"}
      </p>
    </div>
  );

  return (
    <ArticleCanvas showToc={false} headerSlot={header}>
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-xs text-zinc-500">
          Loading {activeTab}...
        </div>
      ) : (
        <pre className="font-mono text-[12px] leading-relaxed text-zinc-300 bg-[#141516] p-5 rounded-2xl overflow-x-auto whitespace-pre-wrap select-text">
          {content}
        </pre>
      )}
    </ArticleCanvas>
  );
}
